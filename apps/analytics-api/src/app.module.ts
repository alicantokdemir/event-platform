import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { AppController } from './app.controller';
import { AnalyticsRepository } from './analytics.repository';
import { Cache } from './cache';
import { DbModule } from './db/db.module';
import { DashboardService } from './dashboard.service';
import { EventMetricsEntity } from './db/entities/event-metrics.entity';
import { EventChannelMetricsEntity } from './db/entities/event-channel-metrics.entity';

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([EventMetricsEntity, EventChannelMetricsEntity])],
  controllers: [AppController, DashboardController],
  providers: [AnalyticsRepository, DashboardService, Cache],
})
export class AppModule {}
