import { EventMetricsEntity } from './event-metrics.entity';
import { EventChannelMetricsEntity } from './event-channel-metrics.entity';

export class EventMetricsAggregate {
  constructor(
    public readonly metrics: EventMetricsEntity,
    public readonly channelMetrics: EventChannelMetricsEntity[]
  ) {}

  occupancyPct(): number {
    if (this.metrics.capacityTotal <= 0) return 0;
    return (this.metrics.ticketsSoldTotal / this.metrics.capacityTotal) * 100;
  }
}
