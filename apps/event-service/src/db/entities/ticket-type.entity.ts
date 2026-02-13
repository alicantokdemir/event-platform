import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { EventEntity } from './event.entity';

@Entity({ name: 'ticket_types' })
@Check('ticket_types_kind_check', "kind IN ('FULL','HALF')")
@Check('ticket_types_price_cents_check', 'price_cents >= 0')
@Check('ticket_types_capacity_check', 'capacity >= 0')
@Index('idx_ticket_types_event_id', ['event_id'])
export class TicketTypeEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column('uuid')
  event_id!: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: EventEntity;

  @Column('text')
  name!: string;

  @Column('text')
  kind!: string;

  @Column('int')
  price_cents!: number;

  @Column('int')
  capacity!: number;

  @Column('timestamptz', { default: () => 'now()' })
  created_at!: Date;

  @Column('timestamptz', { default: () => 'now()' })
  updated_at!: Date;
}
