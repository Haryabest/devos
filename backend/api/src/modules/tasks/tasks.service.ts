import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaClient, TaskStatus, CommentTarget } from '@prisma/client';
import type { CreateTaskDto, UpdateTaskDto } from './tasks.dto.js';

@Injectable()
export class TasksService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException();
    return project;
  }

  private async assertTaskAccess(taskId: string, userId: string) {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    await this.assertProjectAccess(task.projectId, userId);
    return task;
  }

  async list(projectId: string, userId: string, status?: TaskStatus) {
    await this.assertProjectAccess(projectId, userId);
    return this.prisma.task.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        dependencies: { select: { toId: true } },
        _count: { select: { children: true, comments: true } },
      },
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    await this.assertProjectAccess(projectId, userId);
    return this.prisma.task.create({
      data: {
        projectId,
        authorId: userId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? 'BACKLOG',
        priority: dto.priority ?? 'MEDIUM',
        assigneeId: dto.assigneeId,
        parentId: dto.parentId,
        sprintId: dto.sprintId,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUniqueOrThrow({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        author: { select: { id: true, name: true, avatarUrl: true } },
        children: true,
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        dependencies: { select: { toId: true } },
      },
    });
    await this.assertProjectAccess(task.projectId, userId);
    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    await this.assertProjectAccess(task.projectId, userId);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueAt: dto.dueAt === undefined ? undefined : dto.dueAt ? new Date(dto.dueAt) : null,
      },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    await this.assertProjectAccess(task.projectId, userId);
    await this.prisma.task.delete({ where: { id } });
  }

  async addComment(taskId: string, userId: string, body: string) {
    await this.assertTaskAccess(taskId, userId);
    return this.prisma.comment.create({
      data: {
        targetKind: CommentTarget.TASK,
        targetId: taskId,
        authorId: userId,
        body,
      },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async addDependency(fromId: string, toId: string, userId: string) {
    if (fromId === toId) throw new BadRequestException('Задача не может зависеть от себя');
    const from = await this.assertTaskAccess(fromId, userId);
    const to = await this.assertTaskAccess(toId, userId);
    if (from.projectId !== to.projectId) {
      throw new BadRequestException('Зависимости только внутри проекта');
    }
    return this.prisma.taskDependency.upsert({
      where: { fromId_toId: { fromId, toId } },
      create: { fromId, toId },
      update: {},
    });
  }

  async removeDependency(fromId: string, toId: string, userId: string) {
    await this.assertTaskAccess(fromId, userId);
    await this.prisma.taskDependency.deleteMany({ where: { fromId, toId } });
  }

  async reorder(
    projectId: string,
    userId: string,
    items: { id: string; order: number; status: TaskStatus }[],
  ) {
    await this.assertProjectAccess(projectId, userId);
    const ids = items.map((i) => i.id);
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: ids }, projectId },
      select: { id: true },
    });
    if (tasks.length !== ids.length) throw new NotFoundException('Одна или несколько задач не найдены');

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.task.update({
          where: { id: item.id },
          data: { order: item.order, status: item.status },
        }),
      ),
    );

    return { ok: true };
  }
}
