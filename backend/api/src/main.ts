import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { env } from './config/env.js';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: env.NODE_ENV === 'development',
      trustProxy: true,
      bodyLimit: 25 * 1024 * 1024,
    }),
    { bufferLogs: true },
  );

  await app.register(await import('@fastify/helmet').then((m) => m.default), {
    contentSecurityPolicy: false,
  });
  await app.register(await import('@fastify/cors').then((m) => m.default), {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'health/(.*)'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('DevOS API')
    .setDescription('AI-first development workspace')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.log(`DevOS API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
  logger.log(`Swagger UI: http://${env.HOST}:${env.PORT}/api/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal boot error:', err);
  process.exit(1);
});
