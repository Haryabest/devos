import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkersModule } from './workers.module.js';

async function bootstrap() {
  const logger = new Logger('worker');
  const app = await NestFactory.createApplicationContext(WorkersModule, { bufferLogs: true });
  app.enableShutdownHooks();
  logger.log('DevOS worker started (BullMQ: embeddings, notifications-email, github-sync)');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal worker error:', err);
  process.exit(1);
});
