import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { EventEntity } from './entities/event.entity';
import { TicketTypeEntity } from './entities/ticket-type.entity';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: connectionString,
  entities: [EventEntity, TicketTypeEntity],
  migrations: [path.join(__dirname, '..', '..', 'migrations', '*{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
});

export default AppDataSource;
