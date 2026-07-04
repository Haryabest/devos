import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { env } from './config/env.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WorkspacesModule } from './modules/workspaces/workspaces.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { ClientsModule } from './modules/clients/clients.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { RoadmapModule } from './modules/roadmap/roadmap.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { SyncModule } from './modules/sync/sync.module.js';
import { WhiteboardsModule } from './modules/whiteboards/whiteboards.module.js';
import { ObservabilityModule } from './modules/observability/observability.module.js';
import { WsBridgeModule } from './modules/ws-bridge/ws-bridge.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: env.RATE_LIMIT_TTL_MS,
        limit: env.RATE_LIMIT_MAX,
      },
    ]),
    CacheModule.register({ isGlobal: true, ttl: 60_000, max: 500 }),
    PrismaModule,
    RedisModule,
    WsBridgeModule,
    ObservabilityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    ClientsModule,
    FilesModule,
    DocumentsModule,
    IntegrationsModule,
    AiModule,
    SearchModule,
    NotificationsModule,
    SyncModule,
    WhiteboardsModule,
    RoadmapModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
