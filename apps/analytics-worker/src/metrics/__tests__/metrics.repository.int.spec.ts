import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MetricsRepository } from '../metrics.repository';
import { EventMetricsEntity } from '../../db/entities/event-metrics.entity';
import { EventChannelMetricsEntity } from '../../db/entities/event-channel-metrics.entity';
import { ProcessedSaleEntity } from '../../db/entities/processed-sale.entity';
import { randomUUID } from 'crypto';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe('MetricsRepository (integration)', () => {
  if (!testDbUrl) {
    it('skips because DATABASE_URL is not set', () => {
      expect(testDbUrl).toBeDefined();
    });
    return;
  }

  let repo: MetricsRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: testDbUrl,
          entities: [EventMetricsEntity, EventChannelMetricsEntity, ProcessedSaleEntity],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([EventMetricsEntity, EventChannelMetricsEntity, ProcessedSaleEntity]),
      ],
      providers: [MetricsRepository],
    }).compile();

    repo = moduleRef.get(MetricsRepository);
    dataSource = moduleRef.get(DataSource);
  });

  it('finds missing capacity and updates it', async () => {
    const eventId = randomUUID();
    await dataSource.query(
      `INSERT INTO event_metrics (event_id, gtv_cents_total, tickets_sold_total, capacity_total, updated_at)
       VALUES ($1::uuid, 0, 0, 0, now())`,
      [eventId]
    );

    const rows = await repo.findEventsWithMissingCapacity([eventId]);
    expect(rows.length).toBe(1);

    await repo.updateCapacity(eventId, 500);
    const updated = await dataSource.query('SELECT capacity_total FROM event_metrics WHERE event_id = $1::uuid', [eventId]);
    expect(Number(updated[0].capacity_total)).toBe(500);

    await dataSource.query('DELETE FROM event_metrics WHERE event_id = $1::uuid', [eventId]);
  });
});
