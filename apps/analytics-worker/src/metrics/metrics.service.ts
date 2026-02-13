import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { TicketSoldMessage } from '@platform/contracts';
import { BatchMetricsAggregate } from '../domain/metrics/batch-metrics.aggregate';
import { MetricsRepository } from './metrics.repository';

@Injectable()
export class MetricsService {
  private readonly eventServiceBase = process.env.EVENT_SERVICE_URL ?? '';

  constructor(private readonly dataSource: DataSource, private readonly repo: MetricsRepository) {}

  async processBatch(parsed: { msg: TicketSoldMessage }[]): Promise<{ eventIds: string[] }> {
    if (parsed.length === 0) return { eventIds: [] };

    const saleIds = parsed.map((p) => p.msg.sale_id);
    if (saleIds.length === 0) return { eventIds: [] };

    const existingSet = await this.repo.findProcessedSales(saleIds);
    const fresh = parsed.filter((p) => !existingSet.has(p.msg.sale_id));
    if (fresh.length === 0) return { eventIds: [] };

    const aggregate = new BatchMetricsAggregate();
    for (const { msg } of fresh) aggregate.addSale(msg);

    await this.dataSource.transaction(async (manager) => {
      await this.repo.insertProcessedSales(
        fresh.map((p) => p.msg.sale_id),
        manager
      );

      await this.repo.ensureEventMetricsRows(aggregate.eventIds(), manager);

      for (const [eventId, v] of aggregate.totalsEntries()) {
        await this.repo.upsertEventTotals(eventId, v.gtv, v.sold, manager);
      }

      for (const [key, v] of aggregate.channelEntries()) {
        const [eventId, channel] = key.split('::');
        await this.repo.upsertEventChannel(eventId, channel, v.gtv, v.sold, manager);
      }
    });

    return { eventIds: aggregate.eventIds() };
  }

  async fillMissingCapacities(eventIds: string[]): Promise<void> {
    if (!this.eventServiceBase) return;
    const rows = await this.repo.findEventsWithMissingCapacity(eventIds);
    for (const r of rows) {
      try {
        const url = `${this.eventServiceBase}/internal/event-capacity?eventId=${encodeURIComponent(r.eventId)}`;
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data: any = await resp.json();
        const cap = Number(data.capacity_total ?? 0);
        if (cap > 0) {
          await this.repo.updateCapacity(r.eventId, cap);
        }
      } catch {
        // ignore
      }
    }
  }
}
