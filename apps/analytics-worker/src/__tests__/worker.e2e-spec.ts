import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../worker.module';
import { SqsClient } from '../sqs';
import { Worker } from '../worker';
import { DataSource } from 'typeorm';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe('Worker (e2e)', () => {
  if (!testDbUrl) {
    it('skips because DATABASE_URL is not set', () => {
      expect(testDbUrl).toBeDefined();
    });
    return;
  }

  it('processes a single SQS message', async () => {
    const eventId = randomUUID();
    const saleId = randomUUID();

    const message = {
      Body: JSON.stringify({
        sale_id: saleId,
        occurred_at: new Date().toISOString(),
        event_id: eventId,
        ticket_type_id: randomUUID(),
        channel: 'online',
        quantity: 1,
        unit_price_cents: 5000,
        gtv_cents: 5000,
      }),
    };

    const fakeSqs = {
      receive: jest.fn(async () => [message]),
      deleteBatch: jest.fn(async () => undefined),
    };

    process.env.DATABASE_URL = testDbUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SqsClient)
      .useValue(fakeSqs)
      .compile();

    const worker = moduleRef.get(Worker);
    const dataSource = moduleRef.get(DataSource);

    await worker.poll();

    const processed = await dataSource.query('SELECT sale_id FROM processed_sales WHERE sale_id = $1::uuid', [saleId]);
    expect(processed.length).toBe(1);

    await dataSource.query('DELETE FROM processed_sales WHERE sale_id = $1::uuid', [saleId]);
    await dataSource.query('DELETE FROM event_channel_metrics WHERE event_id = $1::uuid', [eventId]);
    await dataSource.query('DELETE FROM event_metrics WHERE event_id = $1::uuid', [eventId]);
  });
});
