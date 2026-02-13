import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { SqsClient } from '../../sqs/sqs.client';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe('EventsController (e2e)', () => {
  if (!testDbUrl) {
    it('skips because DATABASE_URL is not set', () => {
      expect(testDbUrl).toBeDefined();
    });
    return;
  }

  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SqsClient)
      .useValue({ sendJson: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and manages events and ticket types', async () => {
    const createEvent = await request(app.getHttpServer())
      .post('/events')
      .send({
        name: 'E2E Event',
        location: 'Arena',
        total_capacity: 500,
        sales_channels: ['online', 'box_office'],
      })
      .expect(201);

    const eventId = createEvent.body.id as string;

    await request(app.getHttpServer()).get(`/events/${eventId}`).expect(200);

    const ticket = await request(app.getHttpServer())
      .post(`/events/${eventId}/ticket-types`)
      .send({
        name: 'Standard',
        kind: 'FULL',
        price_cents: 10000,
        capacity: 100,
      })
      .expect(201);

    const ticketId = ticket.body.id as string;

    await request(app.getHttpServer()).get(`/ticket-types/${ticketId}`).expect(200);

    await request(app.getHttpServer()).delete(`/events/${eventId}`).expect(200);
  });
});
