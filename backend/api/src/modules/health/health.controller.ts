import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import type { HealthResponse } from '@devos/shared';
import { REDIS_CLIENT } from '../redis/redis.module.js';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const dbUp = await this.prisma
      .$queryRawUnsafe('SELECT 1')
      .then(() => true)
      .catch(() => false);

    const redisUp = await this.redis
      .ping()
      .then(() => true)
      .catch(() => false);

    const ok = dbUp && redisUp;

    return {
      status: ok ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: Math.round((Date.now() - this.startedAt) / 1000),
      services: {
        db: dbUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    };
  }
}
