export class EventEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public location: string,
    public totalCapacity: number,
    public salesChannels: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
