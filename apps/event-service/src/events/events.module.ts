import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';
import { SqsClient } from '../sqs/sqs.client';
import { EventEntity } from '../db/entities/event.entity';
import { TicketTypeEntity } from '../db/entities/ticket-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, TicketTypeEntity])],
  controllers: [EventsController],
  providers: [EventsRepository, EventsService, SqsClient],
})
export class EventsModule {}
