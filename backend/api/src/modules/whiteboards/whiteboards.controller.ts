import { Controller, Get, Put, Body, Param, Query, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { WhiteboardsService } from './whiteboards.service.js';
import { UpsertWhiteboardDto } from './whiteboards.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('whiteboards')
@ApiBearerAuth()
@Controller('whiteboards')
export class WhiteboardsController {
  constructor(
    @Inject(WhiteboardsService) private readonly svc: WhiteboardsService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  @ApiQuery({ name: 'workspaceId', required: true })
  async list(@Query('workspaceId') workspaceId: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.list(workspaceId, userId);
  }

  @Get('project/:projectId')
  async getByProjectId(
    @Param('projectId') projectId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.getByProjectId(projectId, userId);
  }

  @Put('project/:projectId')
  async upsertContent(
    @Param('projectId') projectId: string,
    @Body() dto: UpsertWhiteboardDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.upsertContent(projectId, userId, dto);
  }
}
