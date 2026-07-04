import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module.js';

@Module({ imports: [IntegrationsModule], exports: [IntegrationsModule] })
export class GithubModule {}
