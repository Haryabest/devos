import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { EmbeddingsProcessor } from './modules/ai/embeddings.processor.js';
import { NotificationsProcessor } from './modules/notifications/notifications.processor.js';
import { GithubSyncProcessor } from './modules/integrations/github-sync.processor.js';

/** BullMQ workers — отдельный процесс, не масштабируется вместе с HTTP API. */
@Module({
  imports: [PrismaModule, RedisModule, AiModule, MailModule],
  providers: [EmbeddingsProcessor, NotificationsProcessor, GithubSyncProcessor],
})
export class WorkersModule {}
