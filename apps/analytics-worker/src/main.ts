import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // keep process alive
}
bootstrap();
