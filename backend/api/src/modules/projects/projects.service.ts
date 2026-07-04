import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { CreateProjectDto, UpdateProjectDto, CreateMilestoneDto, UpdateMilestoneDto } from './projects.dto.js';

@Injectable()
export class ProjectsService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

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

  async update(id: string, userId: string, dto: UpdateProjectDto) {
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

  private milestoneToApi(row: {
    id: string;
    projectId: string;
    name: string;
    version: string | null;
    dueAt: Date | null;
    releasedAt: Date | null;
  }) {
    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      version: row.version,
      dueAt: row.dueAt?.toISOString() ?? null,
      releasedAt: row.releasedAt?.toISOString() ?? null,
    };
  }

  async listMilestones(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    await this.assertMember(project.workspaceId, userId);
    const rows = await this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ dueAt: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => this.milestoneToApi(r));
  }

  async createMilestone(projectId: string, userId: string, dto: CreateMilestoneDto) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    await this.assertMember(project.workspaceId, userId);
    const row = await this.prisma.milestone.create({
      data: {
        projectId,
        name: dto.name,
        version: dto.version,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        releasedAt: dto.releasedAt ? new Date(dto.releasedAt) : undefined,
      },
    });
    return this.milestoneToApi(row);
  }

  async updateMilestone(id: string, userId: string, dto: UpdateMilestoneDto) {
    const existing = await this.prisma.milestone.findUniqueOrThrow({ where: { id } });
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: existing.projectId } });
    await this.assertMember(project.workspaceId, userId);
    const row = await this.prisma.milestone.update({
      where: { id },
      data: {
        name: dto.name,
        version: dto.version,
        dueAt: dto.dueAt === undefined ? undefined : dto.dueAt ? new Date(dto.dueAt) : null,
        releasedAt:
          dto.releasedAt === undefined ? undefined : dto.releasedAt ? new Date(dto.releasedAt) : null,
      },
    });
    return this.milestoneToApi(row);
  }

  async removeMilestone(id: string, userId: string) {
    const existing = await this.prisma.milestone.findUniqueOrThrow({ where: { id } });
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: existing.projectId } });
    await this.assertMember(project.workspaceId, userId);
    await this.prisma.milestone.delete({ where: { id } });
  }
}
