import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMetricsEntity } from './entities/event-metrics.entity';
import { EventChannelMetricsEntity } from './entities/event-channel-metrics.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [EventMetricsEntity, EventChannelMetricsEntity],
      synchronize: false,
      migrationsRun: false,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DbModule {}
