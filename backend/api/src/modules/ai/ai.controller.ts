import { Controller, Get, Post, Body, Param, Query, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AiService } from './ai.service.js';
import {
  AiAskDto,
  AiGenerateTasksDto,
  AiDocumentAssistDto,
  AiRoadmapSuggestDto,
  AiWhiteboardSuggestDto,
  AiAnalyzeProjectDto,
} from './ai.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    @Inject(AiService) private readonly svc: AiService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Post('ask')
  async ask(@Body() dto: AiAskDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.ask(userId, dto);
  }

  @Post('generate-tasks')
  async generateTasks(@Body() dto: AiGenerateTasksDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.generateTasks(userId, dto);
  }

  @Post('document-assist')
  async documentAssist(@Body() dto: AiDocumentAssistDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.documentAssist(userId, dto);
  }

  @Post('roadmap-suggest')
  async roadmapSuggest(@Body() dto: AiRoadmapSuggestDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.roadmapSuggest(userId, dto);
  }

  @Post('whiteboard-suggest')
  async whiteboardSuggest(
    @Body() dto: AiWhiteboardSuggestDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.whiteboardSuggest(userId, dto);
  }

  @Post('analyze-project')
  async analyzeProject(@Body() dto: AiAnalyzeProjectDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.analyzeProject(userId, dto.workspaceId, dto.projectId);
  }

  @Get('conversations')
  @ApiQuery({ name: 'workspaceId', required: true })
  async conversations(
    @Query('workspaceId') workspaceId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.listConversations(workspaceId, userId);
  }

  @Get('health-score/:projectId')
  async healthScore(@Param('projectId') projectId: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.healthScore(projectId, userId);
  }

  @Post('index-workspace')
  @ApiQuery({ name: 'workspaceId', required: true })
  async indexWorkspace(
    @Query('workspaceId') workspaceId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.indexWorkspace(workspaceId, userId);
  }
}
