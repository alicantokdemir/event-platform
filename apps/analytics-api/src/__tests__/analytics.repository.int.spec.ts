import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbModule } from '../db/db.module';
import { AnalyticsRepository } from '../analytics.repository';
import { EventMetricsEntity } from '../db/entities/event-metrics.entity';
import { EventChannelMetricsEntity } from '../db/entities/event-channel-metrics.entity';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe('AnalyticsRepository (integration)', () => {
  if (!testDbUrl) {
    it('skips because DATABASE_URL is not set', () => {
      expect(testDbUrl).toBeDefined();
    });
    return;
  }

  let repo: AnalyticsRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [DbModule, TypeOrmModule.forFeature([EventMetricsEntity, EventChannelMetricsEntity])],
      providers: [AnalyticsRepository],
    }).compile();

    repo = moduleRef.get(AnalyticsRepository);
    dataSource = moduleRef.get(DataSource);
  });

  it('returns overview and channels', async () => {
    const eventId = randomUUID();
    await dataSource.query(
      `INSERT INTO event_metrics (event_id, gtv_cents_total, tickets_sold_total, capacity_total, updated_at)
       VALUES ($1::uuid, 1500, 15, 100, now())`,
      [eventId]
    );
    await dataSource.query(
      `INSERT INTO event_channel_metrics (event_id, channel, gtv_cents, tickets_sold, updated_at)
       VALUES ($1::uuid, $2, 1000, 10, now())`,
      [eventId, 'online']
    );

    const overview = await repo.getOverview(eventId);
    const channels = await repo.getChannels(eventId);

    expect(overview?.eventId).toBe(eventId);
    expect(channels.length).toBe(1);

    await dataSource.query('DELETE FROM event_channel_metrics WHERE event_id = $1::uuid', [eventId]);
    await dataSource.query('DELETE FROM event_metrics WHERE event_id = $1::uuid', [eventId]);
  });
});
