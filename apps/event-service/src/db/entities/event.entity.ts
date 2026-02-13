import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'events' })
@Check('events_total_capacity_check', 'total_capacity >= 0')
export class EventEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column('text')
  name!: string;

  @Column('text')
  location!: string;

  @Column('int')
  total_capacity!: number;

  @Column('jsonb')
  sales_channels!: unknown;

  @Column('timestamptz', { default: () => 'now()' })
  created_at!: Date;

  @Column('timestamptz', { default: () => 'now()' })
  updated_at!: Date;
}
