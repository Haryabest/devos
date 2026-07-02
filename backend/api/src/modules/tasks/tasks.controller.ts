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
import { TasksService, type CreateTaskDto } from './tasks.service.js';
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

  @Get('tasks/:id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.findOne(id, userId);
  }

  @Patch('tasks/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTaskDto>,
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
}
