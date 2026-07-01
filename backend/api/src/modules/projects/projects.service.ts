import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, ProjectStatus, ProjectType } from '@prisma/client';

export interface CreateProjectDto {
  name: string;
  description?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  clientId?: string;
  startAt?: string;
  dueAt?: string;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaClient) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
    return m;
  }

  async list(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(workspaceId: string, userId: string, dto: CreateProjectDto) {
    await this.assertMember(workspaceId, userId);
    return this.prisma.project.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        type: dto.type ?? 'OTHER',
        status: dto.status ?? 'PLANNED',
        clientId: dto.clientId,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { tasks: true, documents: true, sprints: true } },
      },
    });
    if (!project) throw new NotFoundException();
    await this.assertMember(project.workspaceId, userId);
    return project;
  }

  async update(id: string, userId: string, dto: Partial<CreateProjectDto>) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id } });
    await this.assertMember(project.workspaceId, userId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id } });
    await this.assertMember(project.workspaceId, userId);
    await this.prisma.project.delete({ where: { id } });
  }
}
