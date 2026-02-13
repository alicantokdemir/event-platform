import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsRepository } from '../events.repository';
import { DbModule } from '../../db/db.module';
import { EventEntity } from '../../db/entities/event.entity';
import { TicketTypeEntity } from '../../db/entities/ticket-type.entity';

const testDbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe('EventsRepository (integration)', () => {
  if (!testDbUrl) {
    it('skips because DATABASE_URL is not set', () => {
      expect(testDbUrl).toBeDefined();
    });
    return;
  }

  let repo: EventsRepository;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [DbModule, TypeOrmModule.forFeature([EventEntity, TicketTypeEntity])],
      providers: [EventsRepository],
    }).compile();

    repo = moduleRef.get(EventsRepository);
  });

  it('creates and retrieves events and ticket types', async () => {
    const event = await repo.createEvent({
      name: 'Integration Event',
      location: 'Hall A',
      total_capacity: 200,
      sales_channels: ['online', 'box_office'],
    });

    const fetched = await repo.getEvent(event.id);
    expect(fetched?.name).toBe('Integration Event');

    const ticket = await repo.createTicketType(event.id, {
      name: 'VIP',
      kind: 'FULL',
      price_cents: 25000,
      capacity: 50,
    });

    const tickets = await repo.listTicketTypes(event.id);
    expect(tickets.find((t) => t.id === ticket.id)).toBeTruthy();

    await repo.deleteEvent(event.id);
  });
});
