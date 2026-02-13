import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { EventMetricsEntity as EventMetricsDbEntity } from '../db/entities/event-metrics.entity';
import { ProcessedSaleEntity as ProcessedSaleDbEntity } from '../db/entities/processed-sale.entity';
import { EventMetricsEntity } from '../domain/metrics/event-metrics.entity';

@Injectable()
export class MetricsRepository {
  constructor(
    @InjectRepository(EventMetricsDbEntity)
    private readonly metricsRepo: Repository<EventMetricsDbEntity>,
    @InjectRepository(ProcessedSaleDbEntity)
    private readonly processedRepo: Repository<ProcessedSaleDbEntity>
  ) {}

  async findProcessedSales(saleIds: string[]): Promise<Set<string>> {
    if (saleIds.length === 0) return new Set();
    const rows = await this.processedRepo.find({ select: ['sale_id'], where: { sale_id: In(saleIds) } });
    return new Set(rows.map((r) => r.sale_id));
  }

  async insertProcessedSales(saleIds: string[], manager: EntityManager): Promise<void> {
    if (saleIds.length === 0) return;
    const values = saleIds.map((_, idx) => `($${idx + 1}::uuid, now())`).join(',');
    await manager.query(
      `INSERT INTO processed_sales (sale_id, processed_at) VALUES ${values} ON CONFLICT (sale_id) DO NOTHING`,
      saleIds
    );
  }

  async ensureEventMetricsRows(eventIds: string[], manager: EntityManager): Promise<void> {
    for (const eventId of eventIds) {
      await manager.query(
        `INSERT INTO event_metrics (event_id, gtv_cents_total, tickets_sold_total, capacity_total, updated_at)
         VALUES ($1::uuid, 0, 0, COALESCE((SELECT capacity_total FROM event_metrics WHERE event_id = $1::uuid), 0), now())
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId]
      );
    }
  }

  async upsertEventTotals(eventId: string, gtv: number, sold: number, manager: EntityManager): Promise<void> {
    await manager.query(
      `INSERT INTO event_metrics (event_id, gtv_cents_total, tickets_sold_total, capacity_total, updated_at)
       VALUES ($1::uuid, $2::bigint, $3::bigint, COALESCE((SELECT capacity_total FROM event_metrics WHERE event_id = $1::uuid), 0), now())
       ON CONFLICT (event_id) DO UPDATE
       SET gtv_cents_total = event_metrics.gtv_cents_total + EXCLUDED.gtv_cents_total,
           tickets_sold_total = event_metrics.tickets_sold_total + EXCLUDED.tickets_sold_total,
           updated_at = now()`,
      [eventId, gtv, sold]
    );
  }

  async upsertEventChannel(eventId: string, channel: string, gtv: number, sold: number, manager: EntityManager): Promise<void> {
    await manager.query(
      `INSERT INTO event_channel_metrics (event_id, channel, gtv_cents, tickets_sold, updated_at)
       VALUES ($1::uuid, $2, $3::bigint, $4::bigint, now())
       ON CONFLICT (event_id, channel) DO UPDATE
       SET gtv_cents = event_channel_metrics.gtv_cents + EXCLUDED.gtv_cents,
           tickets_sold = event_channel_metrics.tickets_sold + EXCLUDED.tickets_sold,
           updated_at = now()`,
      [eventId, channel, gtv, sold]
    );
  }

  async findEventsWithMissingCapacity(eventIds: string[]): Promise<EventMetricsEntity[]> {
    if (eventIds.length === 0) return [];
    const rows = await this.metricsRepo.find({ where: { event_id: In(eventIds), capacity_total: 0 } });
    return rows.map((row) => this.mapMetrics(row));
  }

  async updateCapacity(eventId: string, capacityTotal: number): Promise<void> {
    await this.metricsRepo.update({ event_id: eventId }, { capacity_total: capacityTotal, updated_at: new Date() });
  }

  private mapMetrics(row: EventMetricsDbEntity): EventMetricsEntity {
    return new EventMetricsEntity(
      row.event_id,
      Number(row.gtv_cents_total),
      Number(row.tickets_sold_total),
      Number(row.capacity_total),
      row.updated_at ? new Date(row.updated_at) : new Date()
    );
  }

}
