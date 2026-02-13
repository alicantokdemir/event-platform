export class EventChannelMetricsEntity {
  constructor(
    public readonly eventId: string,
    public readonly channel: string,
    public gtvCents: number,
    public ticketsSold: number,
    public updatedAt: Date
  ) {}
}
