import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module.js';
import { env } from './config/env.js';
import { registerGithubWebhookRawBody } from './lib/fastify-raw-body.js';

async function bootstrap() {
  const logger = new Logger('bootstrap');

  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
    logger.log('Sentry initialized');
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: env.NODE_ENV === 'development',
      trustProxy: true,
      bodyLimit: 25 * 1024 * 1024,
    }),
    { bufferLogs: true },
  );

  await app.register(await import('@fastify/compress').then((m) => m.default), {
    global: true,
    encodings: ['gzip', 'deflate'],
  });

  await app.register(await import('@fastify/helmet').then((m) => m.default), {
    contentSecurityPolicy: false,
  });
  await app.register(await import('@fastify/cors').then((m) => m.default), {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(await import('@fastify/multipart').then((m) => m.default), {
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  registerGithubWebhookRawBody(app.getHttpAdapter().getInstance());

  app.setGlobalPrefix('api', { exclude: ['health', 'health/(.*)', 'metrics'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.enableShutdownHooks();
  app.useWebSocketAdapter(new WsAdapter(app));

  try {
    const swagger = new DocumentBuilder()
      .setTitle('DevOS API')
      .setDescription('AI-first development workspace')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));
    logger.log(`Swagger UI: http://${env.HOST}:${env.PORT}/api/docs`);
  } catch (err) {
    logger.warn('Swagger UI disabled (schema generation failed)', err);
  }

  await app.init();

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.log(`DevOS API listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal boot error:', err);
  process.exit(1);
});
