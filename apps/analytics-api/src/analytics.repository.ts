import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMetricsEntity } from './domain/metrics/event-metrics.entity';
import { EventChannelMetricsEntity } from './domain/metrics/event-channel-metrics.entity';
import { EventMetricsEntity as EventMetricsDbEntity } from './db/entities/event-metrics.entity';
import { EventChannelMetricsEntity as EventChannelMetricsDbEntity } from './db/entities/event-channel-metrics.entity';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectRepository(EventMetricsDbEntity)
    private readonly metricsRepo: Repository<EventMetricsDbEntity>,
    @InjectRepository(EventChannelMetricsDbEntity)
    private readonly channelsRepo: Repository<EventChannelMetricsDbEntity>
  ) {}

  async getOverview(eventId: string): Promise<EventMetricsEntity | null> {
    const row = await this.metricsRepo.findOne({ where: { event_id: eventId } });
    return row ? this.mapMetrics(row) : null;
  }

  async getChannels(eventId: string): Promise<EventChannelMetricsEntity[]> {
    const rows = await this.channelsRepo.find({ where: { event_id: eventId }, order: { channel: 'ASC' } });
    return rows.map((row) => this.mapChannel(eventId, row));
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

  private mapChannel(eventId: string, row: EventChannelMetricsDbEntity): EventChannelMetricsEntity {
    return new EventChannelMetricsEntity(
      eventId,
      row.channel,
      Number(row.gtv_cents),
      Number(row.tickets_sold),
      row.updated_at ? new Date(row.updated_at) : new Date()
    );
  }
}
