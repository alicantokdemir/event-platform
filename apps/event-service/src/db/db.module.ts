import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import { EventEntity } from './entities/event.entity';
import { TicketTypeEntity } from './entities/ticket-type.entity';
import { TransactionService } from './transaction.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [EventEntity, TicketTypeEntity],
      migrations: [path.join(__dirname, '..', '..', 'migrations', '*{.ts,.js}')],
      synchronize: false,
      migrationsRun: false,
    })
  ],
  providers: [TransactionService],
  exports: [TypeOrmModule, TransactionService]
})
export class DbModule {}
