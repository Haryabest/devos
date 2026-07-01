import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ProjectsService, type CreateProjectDto } from './projects.service.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService, private readonly guard: JwtGuard) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  @ApiQuery({ name: 'workspaceId', required: true })
  async list(@Query('workspaceId') workspaceId: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.list(workspaceId, userId);
  }

  @Post()
  @ApiQuery({ name: 'workspaceId', required: true })
  async create(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.create(workspaceId, userId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectDto>,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    await this.svc.remove(id, userId);
  }
}
