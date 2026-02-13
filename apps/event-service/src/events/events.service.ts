import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { SqsClient } from '../sqs/sqs.client';
import type {
  EventCreatedPayload,
  EventDeletedPayload,
  EventMessage,
  EventMessageType,
  EventUpdatedPayload,
  TicketTypeCreatedPayload,
  TicketTypeDeletedPayload,
  TicketTypeUpdatedPayload,
} from './event-messages';

@Injectable()
export class EventsService {
  constructor(
    private readonly repo: EventsRepository,
    private readonly sqs: SqsClient
  ) {}

  async listEvents() {
    return this.repo.listEvents();
  }

  async getEvent(id: string) {
    const evt = await this.repo.getEvent(id);
    if (!evt) throw new NotFoundException('Event not found');
    return evt;
  }

  async createEvent(input: { name: string; location: string; total_capacity: number; sales_channels: string[] }) {
    const created = await this.repo.createEvent(input);
    await this.publish<EventCreatedPayload>('event.created', { event: created });
    return created;
  }

  async updateEvent(
    id: string,
    input: Partial<{ name: string; location: string; total_capacity: number; sales_channels: string[] }>
  ) {
    if (input.total_capacity !== undefined) {
      const aggregate = await this.repo.getAggregate(id);
      if (!aggregate) throw new NotFoundException('Event not found');
      if (!aggregate.canSetTotalCapacity(input.total_capacity)) {
        throw new BadRequestException('total_capacity is below existing ticket type capacity');
      }
    }

    const updated = await this.repo.updateEvent(id, input);
    if (!updated) throw new NotFoundException('Event not found');
    await this.publish<EventUpdatedPayload>('event.updated', { event: updated });
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    const ok = await this.repo.deleteEvent(id);
    if (!ok) throw new NotFoundException('Event not found');
    await this.publish<EventDeletedPayload>('event.deleted', { event_id: id });
  }

  async listTicketTypes(eventId: string) {
    return this.repo.listTicketTypes(eventId);
  }

  async getTicketType(id: string) {
    const ticketType = await this.repo.getTicketType(id);
    if (!ticketType) throw new NotFoundException('Ticket type not found');
    return ticketType;
  }

  async createTicketType(eventId: string, input: { name: string; kind: string; price_cents: number; capacity: number }) {
    const aggregate = await this.repo.getAggregate(eventId);
    if (!aggregate) throw new NotFoundException('Event not found');
    if (!aggregate.canAddTicketType(input.capacity)) {
      throw new BadRequestException('ticket type capacity exceeds event total_capacity');
    }

    const created = await this.repo.createTicketType(eventId, input);
    await this.publish<TicketTypeCreatedPayload>('ticket_type.created', { ticket_type: created });
    return created;
  }

  async updateTicketType(id: string, input: Partial<{ name: string; kind: string; price_cents: number; capacity: number }>) {
    const current = await this.repo.getTicketType(id);
    if (!current) throw new NotFoundException('Ticket type not found');

    const aggregate = await this.repo.getAggregate(current.event_id);
    if (!aggregate) throw new NotFoundException('Event not found');

    const nextCapacity = input.capacity ?? current.capacity;
    if (!aggregate.canUpdateTicketType(id, nextCapacity)) {
      throw new BadRequestException('ticket type capacity exceeds event total_capacity');
    }

    const updated = await this.repo.updateTicketType(id, input);
    if (!updated) throw new NotFoundException('Ticket type not found');
    await this.publish<TicketTypeUpdatedPayload>('ticket_type.updated', { ticket_type: updated });
    return updated;
  }

  async deleteTicketType(id: string): Promise<void> {
    const ok = await this.repo.deleteTicketType(id);
    if (!ok) throw new NotFoundException('Ticket type not found');
    await this.publish<TicketTypeDeletedPayload>('ticket_type.deleted', { ticket_type_id: id });
  }

  private async publish<TPayload>(type: EventMessageType, payload: TPayload): Promise<void> {
    const message: EventMessage<TPayload> = {
      type,
      occurred_at: new Date().toISOString(),
      payload,
    };
    await this.sqs.sendJson(message);
  }
}
