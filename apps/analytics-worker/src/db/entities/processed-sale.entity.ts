import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'processed_sales' })
export class ProcessedSaleEntity {
  @PrimaryColumn('uuid')
  sale_id!: string;

  @Column('timestamptz')
  processed_at!: Date;
}
