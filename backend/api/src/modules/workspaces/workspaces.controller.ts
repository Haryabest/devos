import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { WorkspacesService } from './workspaces.service.js';
import { CreateWorkspaceDto } from './workspaces.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly ws: WorkspacesService,
    private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.ws.create(userId, dto);
  }

  @Get()
  async list(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.ws.listForUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.ws.findOne(id, userId);
  }
}
