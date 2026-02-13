import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EventEntity as EventDbEntity } from '../db/entities/event.entity';
import { TicketTypeEntity as TicketTypeDbEntity } from '../db/entities/ticket-type.entity';
import { EventAggregate } from '../domain/events/event.aggregate';
import { EventEntity } from '../domain/events/event.entity';
import { TicketTypeEntity } from '../domain/events/ticket-type.entity';

export type EventRow = EventDbEntity;
export type TicketTypeRow = TicketTypeDbEntity;

@Injectable()
export class EventsRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EventDbEntity)
    private readonly eventsRepo: Repository<EventDbEntity>,
    @InjectRepository(TicketTypeDbEntity)
    private readonly ticketTypesRepo: Repository<TicketTypeDbEntity>
  ) {}

  private eventRepo(manager?: EntityManager): Repository<EventDbEntity> {
    return manager ? manager.getRepository(EventDbEntity) : this.eventsRepo;
  }

  private ticketTypeRepo(manager?: EntityManager): Repository<TicketTypeDbEntity> {
    return manager ? manager.getRepository(TicketTypeDbEntity) : this.ticketTypesRepo;
  }

  async listEvents(): Promise<EventRow[]> {
    return this.eventsRepo.find({ order: { created_at: 'DESC' } });
  }

  async getEvent(id: string): Promise<EventRow | null> {
    return this.eventsRepo.findOne({ where: { id } });
  }

  async createEvent(
    input: { name: string; location: string; total_capacity: number; sales_channels: string[] },
    manager?: EntityManager
  ): Promise<EventRow> {
    const repo = this.eventRepo(manager);
    const entity = repo.create({
      name: input.name,
      location: input.location,
      total_capacity: input.total_capacity,
      sales_channels: input.sales_channels,
    });
    return repo.save(entity);
  }

  async updateEvent(
    id: string,
    input: Partial<{ name: string; location: string; total_capacity: number; sales_channels: string[] }>,
    manager?: EntityManager
  ): Promise<EventRow | null> {
    const repo = this.eventRepo(manager);
    const current = await repo.findOne({ where: { id } });
    if (!current) return null;

    const next = {
      name: input.name ?? current.name,
      location: input.location ?? current.location,
      total_capacity: input.total_capacity ?? current.total_capacity,
      sales_channels: input.sales_channels ?? (current.sales_channels as any),
    };
    const entity = repo.merge(current, {
      ...next,
      updated_at: new Date(),
    });
    return repo.save(entity);
  }

  async deleteEvent(id: string, manager?: EntityManager): Promise<boolean> {
    const repo = this.eventRepo(manager);
    const res = await repo.delete({ id });
    return (res.affected ?? 0) === 1;
  }

  // Ticket types / sectors
  async listTicketTypes(eventId: string): Promise<TicketTypeRow[]> {
    return this.ticketTypesRepo.find({ where: { event_id: eventId }, order: { created_at: 'DESC' } });
  }

  async createTicketType(
    eventId: string,
    input: { name: string; kind: string; price_cents: number; capacity: number },
    manager?: EntityManager
  ): Promise<TicketTypeRow> {
    const work = async (txManager: EntityManager): Promise<TicketTypeRow> => {
      const ttRepo = this.ticketTypeRepo(txManager);
      const entity = ttRepo.create({
        event_id: eventId,
        name: input.name,
        kind: input.kind,
        price_cents: input.price_cents,
        capacity: input.capacity,
      });
      return ttRepo.save(entity);
    };

    if (manager) return work(manager);
    return this.dataSource.transaction(work);
  }

  async getTicketType(id: string): Promise<TicketTypeRow | null> {
    return this.ticketTypesRepo.findOne({ where: { id } });
  }

  async getTicketTypesTotalCapacity(eventId: string, excludeTicketTypeId?: string): Promise<number> {
    if (excludeTicketTypeId) {
      const result = await this.ticketTypesRepo
        .createQueryBuilder('ticket_type')
        .select('COALESCE(SUM(ticket_type.capacity), 0)', 'total')
        .where('ticket_type.event_id = :eventId', { eventId })
        .andWhere('ticket_type.id <> :excludeId', { excludeId: excludeTicketTypeId })
        .getRawOne<{ total: string }>();
      return Number(result?.total ?? 0);
    }
    const result = await this.ticketTypesRepo
      .createQueryBuilder('ticket_type')
      .select('COALESCE(SUM(ticket_type.capacity), 0)', 'total')
      .where('ticket_type.event_id = :eventId', { eventId })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  async updateTicketType(
    id: string,
    input: Partial<{ name: string; kind: string; price_cents: number; capacity: number }>,
    manager?: EntityManager
  ): Promise<TicketTypeRow | null> {
    const work = async (txManager: EntityManager): Promise<TicketTypeRow | null> => {
      const ttRepo = this.ticketTypeRepo(txManager);
      const current = await ttRepo.findOne({ where: { id } });
      if (!current) return null;

      const next = {
        name: input.name ?? current.name,
        kind: input.kind ?? current.kind,
        price_cents: input.price_cents ?? current.price_cents,
        capacity: input.capacity ?? current.capacity,
      };
      const entity = ttRepo.merge(current, {
        ...next,
        updated_at: new Date(),
      });
      return ttRepo.save(entity);
    };

    if (manager) return work(manager);
    return this.dataSource.transaction(work);
  }

  async deleteTicketType(id: string, manager?: EntityManager): Promise<boolean> {
    const work = async (txManager: EntityManager): Promise<boolean> => {
      const ttRepo = this.ticketTypeRepo(txManager);
      const current = await ttRepo.findOne({ where: { id } });
      if (!current) return false;

      const res = await ttRepo.delete({ id });
      const ok = (res.affected ?? 0) === 1;
      return ok;
    };

    if (manager) return work(manager);
    return this.dataSource.transaction(work);
  }

  async getAggregate(eventId: string): Promise<EventAggregate | null> {
    const event = await this.getEvent(eventId);
    if (!event) return null;
    const ticketTypes = await this.listTicketTypes(eventId);
    return new EventAggregate(this.mapEvent(event), ticketTypes.map((row) => this.mapTicketType(row)));
  }

  private mapEvent(row: EventDbEntity): EventEntity {
    const salesChannels = this.toStringArray(row.sales_channels);
    return new EventEntity(
      row.id,
      row.name,
      row.location,
      row.total_capacity,
      salesChannels,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private mapTicketType(row: TicketTypeDbEntity): TicketTypeEntity {
    return new TicketTypeEntity(
      row.id,
      row.event_id,
      row.name,
      row.kind,
      row.price_cents,
      row.capacity,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((v) => typeof v === 'string') as string[];
        }
      } catch {
        return [];
      }
    }
    return [];
  }
}
