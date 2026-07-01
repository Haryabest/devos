import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  parentId?: string;
  sprintId?: string;
  dueAt?: string;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaClient) {}

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException();
    return project;
  }

  async list(projectId: string, userId: string, status?: TaskStatus) {
    await this.assertProjectAccess(projectId, userId);
    return this.prisma.task.findMany({
      where: { projectId, ...(status ? { status } : {}), parentId: null },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
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
        comments: { include: { author: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });
    await this.assertProjectAccess(task.projectId, userId);
    return task;
  }

  async update(id: string, userId: string, dto: Partial<CreateTaskDto>) {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    await this.assertProjectAccess(task.projectId, userId);
    return this.prisma.task.update({
      where: { id },
      data: { ...dto, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    await this.assertProjectAccess(task.projectId, userId);
    await this.prisma.task.delete({ where: { id } });
  }
}
