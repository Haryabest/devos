import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from '../app.module.js';
import { registerGithubWebhookRawBody } from '../lib/fastify-raw-body.js';

export async function createTestApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
    { bufferLogs: true },
  );

  registerGithubWebhookRawBody(app.getHttpAdapter().getInstance());

  app.setGlobalPrefix('api', { exclude: ['health', 'health/(.*)', 'metrics'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();
  return app;
}

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRawUnsafe('SELECT 1');
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    return true;
  } catch {
    return false;
  }
}
