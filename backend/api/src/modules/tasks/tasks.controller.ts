import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { TaskStatus } from '@devos/db';
import { TasksService } from './tasks.service.js';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateCommentDto,
  AddDependencyDto,
  ReorderTasksDto,
} from './tasks.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(
    @Inject(TasksService) private readonly svc: TasksService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get('projects/:projectId/tasks')
  @ApiQuery({ name: 'status', required: false })
  async list(
    @Param('projectId') projectId: string,
    @Query('status') status: TaskStatus | undefined,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.list(projectId, userId, status);
  }

  @Post('projects/:projectId/tasks')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.create(projectId, userId, dto);
  }

  @Patch('projects/:projectId/tasks/reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderTasksDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.reorder(projectId, userId, dto.items);
  }

  @Get('tasks/:id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.findOne(id, userId);
  }

  @Patch('tasks/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.update(id, userId, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    await this.svc.remove(id, userId);
  }

  @Post('tasks/:id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.addComment(id, userId, dto.body);
  }

  @Post('tasks/:id/dependencies')
  async addDependency(
    @Param('id') id: string,
    @Body() dto: AddDependencyDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.addDependency(id, dto.toId, userId);
  }

  @Delete('tasks/:id/dependencies/:toId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDependency(
    @Param('id') id: string,
    @Param('toId') toId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    await this.svc.removeDependency(id, toId, userId);
  }
}
