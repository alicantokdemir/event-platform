export class TicketTypeEntity {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public name: string,
    public kind: string,
    public priceCents: number,
    public capacity: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
