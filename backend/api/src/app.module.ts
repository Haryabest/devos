import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { GithubModule } from './modules/github/github.module.js';
import { GitlabModule } from './modules/gitlab/gitlab.module.js';
import { FigmaModule } from './modules/figma/figma.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { SyncModule } from './modules/sync/sync.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    ClientsModule,
    FilesModule,
    DocumentsModule,
    GithubModule,
    GitlabModule,
    FigmaModule,
    AiModule,
    SearchModule,
    NotificationsModule,
    SyncModule,
  ],
})
export class AppModule {}
