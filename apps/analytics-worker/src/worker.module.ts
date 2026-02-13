import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from './worker';
import { SqsClient } from './sqs';
import { EventMetricsEntity } from './db/entities/event-metrics.entity';
import { EventChannelMetricsEntity } from './db/entities/event-channel-metrics.entity';
import { ProcessedSaleEntity } from './db/entities/processed-sale.entity';
import { MetricsRepository } from './metrics/metrics.repository';
import { MetricsService } from './metrics/metrics.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [EventMetricsEntity, EventChannelMetricsEntity, ProcessedSaleEntity],
      synchronize: false,
      migrationsRun: false,
    }),
    TypeOrmModule.forFeature([EventMetricsEntity, EventChannelMetricsEntity, ProcessedSaleEntity]),
  ],
  providers: [Worker, MetricsRepository, MetricsService, SqsClient],
})
export class AppModule {}
