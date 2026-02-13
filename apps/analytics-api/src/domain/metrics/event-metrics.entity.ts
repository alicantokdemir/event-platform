export class EventMetricsEntity {
  constructor(
    public readonly eventId: string,
    public gtvCentsTotal: number,
    public ticketsSoldTotal: number,
    public capacityTotal: number,
    public updatedAt: Date
  ) {}
}
