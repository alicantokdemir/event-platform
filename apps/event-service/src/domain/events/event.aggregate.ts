import { EventEntity } from './event.entity';
import { TicketTypeEntity } from './ticket-type.entity';

export class EventAggregate {
  constructor(
    public readonly event: EventEntity,
    public readonly ticketTypes: TicketTypeEntity[]
  ) {}

  totalTicketTypeCapacity(): number {
    return this.ticketTypes.reduce((sum, tt) => sum + tt.capacity, 0);
  }

  canSetTotalCapacity(nextTotal: number): boolean {
    return this.totalTicketTypeCapacity() <= nextTotal;
  }

  canAddTicketType(capacity: number): boolean {
    return this.totalTicketTypeCapacity() + capacity <= this.event.totalCapacity;
  }

  canUpdateTicketType(ticketTypeId: string, nextCapacity: number): boolean {
    const otherTotal = this.ticketTypes
      .filter((tt) => tt.id !== ticketTypeId)
      .reduce((sum, tt) => sum + tt.capacity, 0);
    return otherTotal + nextCapacity <= this.event.totalCapacity;
  }

  getTicketType(ticketTypeId: string): TicketTypeEntity | undefined {
    return this.ticketTypes.find((tt) => tt.id === ticketTypeId);
  }
}
