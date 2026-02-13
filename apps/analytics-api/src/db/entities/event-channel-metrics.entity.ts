import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'event_channel_metrics' })
export class EventChannelMetricsEntity {
  @PrimaryColumn('uuid')
  event_id!: string;

  @PrimaryColumn('text')
  channel!: string;

  @Column('bigint', { default: 0 })
  gtv_cents!: string;

  @Column('bigint', { default: 0 })
  tickets_sold!: string;

  @Column('timestamptz', { default: () => 'now()' })
  updated_at!: Date;
}
