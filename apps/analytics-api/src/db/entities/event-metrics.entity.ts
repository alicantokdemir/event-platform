import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'event_metrics' })
export class EventMetricsEntity {
  @PrimaryColumn('uuid')
  event_id!: string;

  @Column('bigint', { default: 0 })
  gtv_cents_total!: string;

  @Column('bigint', { default: 0 })
  tickets_sold_total!: string;

  @Column('int', { default: 0 })
  capacity_total!: number;

  @Column('timestamptz', { default: () => 'now()' })
  updated_at!: Date;
}
