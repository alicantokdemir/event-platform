import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { Cache } from '../cache';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe('DashboardController (e2e)', () => {
  if (!testDbUrl) {
    it('skips because DATABASE_URL is not set', () => {
      expect(testDbUrl).toBeDefined();
    });
    return;
  }

  let app: INestApplication;
  let dataSource: DataSource;

  const cache = {
    store: new Map<string, string>(),
    async getJson<T>(key: string): Promise<T | null> {
      const v = this.store.get(key);
      return v ? (JSON.parse(v) as T) : null;
    },
    async setJson(key: string, value: unknown, _ttlSeconds?: number) {
      this.store.set(key, JSON.stringify(value));
    },
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Cache)
      .useValue(cache)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns overview and channels', async () => {
    const eventId = randomUUID();
    await dataSource.query(
      `INSERT INTO event_metrics (event_id, gtv_cents_total, tickets_sold_total, capacity_total, updated_at)
       VALUES ($1::uuid, 2000, 20, 100, now())`,
      [eventId]
    );
    await dataSource.query(
      `INSERT INTO event_channel_metrics (event_id, channel, gtv_cents, tickets_sold, updated_at)
       VALUES ($1::uuid, $2, 1500, 15, now())`,
      [eventId, 'online']
    );

    await request(app.getHttpServer()).get(`/dashboard/overview?eventId=${eventId}`).expect(200);
    await request(app.getHttpServer()).get(`/dashboard/channels?eventId=${eventId}`).expect(200);

    await dataSource.query('DELETE FROM event_channel_metrics WHERE event_id = $1::uuid', [eventId]);
    await dataSource.query('DELETE FROM event_metrics WHERE event_id = $1::uuid', [eventId]);
  });
});
