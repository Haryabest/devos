import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto, CreateMilestoneDto, UpdateMilestoneDto } from './projects.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly svc: ProjectsService,
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
    @Body() dto: UpdateProjectDto,
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

  @Get(':projectId/milestones')
  async listMilestones(
    @Param('projectId') projectId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.listMilestones(projectId, userId);
  }

  @Post(':projectId/milestones')
  async createMilestone(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.createMilestone(projectId, userId, dto);
  }

  @Patch(':projectId/milestones/:milestoneId')
  async updateMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.updateMilestone(milestoneId, userId, dto);
  }

  @Delete(':projectId/milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMilestone(
    @Param('milestoneId') milestoneId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    await this.svc.removeMilestone(milestoneId, userId);
  }
}
