import type { EventRow, TicketTypeRow } from './events.repository';

export type EventMessageType =
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'ticket_type.created'
  | 'ticket_type.updated'
  | 'ticket_type.deleted';

export interface EventMessage<TPayload> {
  type: EventMessageType;
  occurred_at: string;
  payload: TPayload;
}

export interface EventCreatedPayload {
  event: EventRow;
}

export interface EventUpdatedPayload {
  event: EventRow;
}

export interface EventDeletedPayload {
  event_id: string;
}

export interface TicketTypeCreatedPayload {
  ticket_type: TicketTypeRow;
}

export interface TicketTypeUpdatedPayload {
  ticket_type: TicketTypeRow;
}

export interface TicketTypeDeletedPayload {
  ticket_type_id: string;
}
