import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '../../config/env.js';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          lazyConnect: true,
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }
}
