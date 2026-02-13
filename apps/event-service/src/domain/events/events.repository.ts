import { EventAggregate } from './event.aggregate';
import { EventEntity } from './event.entity';

export interface EventsRepositoryPort {
  listEvents(): Promise<EventEntity[]>;
  getEvent(id: string): Promise<EventEntity | null>;
  getAggregate(eventId: string): Promise<EventAggregate | null>;
}
