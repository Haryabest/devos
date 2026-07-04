import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { CreateRoadmapCardDto, UpdateRoadmapCardDto } from './roadmap.dto.js';

const COLUMN_DEFS = [
  { suffix: 'planned', name: 'Planned', color: '#6366f1', order: 0 },
  { suffix: 'in-progress', name: 'In Progress', color: '#f59e0b', order: 1 },
  { suffix: 'done', name: 'Done', color: '#22c55e', order: 2 },
] as const;

interface MilestoneMeta {
  columnId: string;
  order: number;
  description: string;
}

@Injectable()
export class RoadmapService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  private columnId(projectId: string, suffix: string) {
    return `${projectId}:${suffix}`;
  }

  private defaultColumns(projectId: string) {
    return COLUMN_DEFS.map((c) => ({
      id: this.columnId(projectId, c.suffix),
      projectId,
      name: c.name,
      color: c.color,
      order: c.order,
    }));
  }

  private parseMeta(version: string | null, projectId: string): MilestoneMeta {
    const defaultCol = this.columnId(projectId, 'planned');
    if (!version) return { columnId: defaultCol, order: 0, description: '' };
    try {
      const parsed = JSON.parse(version) as Partial<MilestoneMeta>;
      if (parsed && typeof parsed === 'object' && parsed.columnId) {
        return {
          columnId: parsed.columnId,
          order: parsed.order ?? 0,
          description: parsed.description ?? '',
        };
      }
    } catch {
      return { columnId: defaultCol, order: 0, description: version };
    }
    return { columnId: defaultCol, order: 0, description: version };
  }

  private serializeMeta(meta: MilestoneMeta) {
    return JSON.stringify(meta);
  }

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Проект не найден');
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к проекту');
    return project;
  }

  private milestoneToCard(
    row: { id: string; projectId: string; name: string; version: string | null; dueAt: Date | null; releasedAt: Date | null },
    meta: MilestoneMeta,
  ) {
    return {
      id: row.id,
      projectId: row.projectId,
      columnId: meta.columnId,
      title: row.name,
      description: meta.description,
      order: meta.order,
      createdAt: (row.releasedAt ?? row.dueAt ?? new Date()).toISOString(),
    };
  }

  async getBoard(projectId: string, userId: string) {
    await this.assertProjectAccess(projectId, userId);
    const milestones = await this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueAt: 'asc' },
    });
    const cards = milestones.map((m) => this.milestoneToCard(m, this.parseMeta(m.version, projectId)));
    return { columns: this.defaultColumns(projectId), cards };
  }

  async createCard(userId: string, dto: CreateRoadmapCardDto) {
    await this.assertProjectAccess(dto.projectId, userId);
    const meta: MilestoneMeta = {
      columnId: dto.columnId,
      order: dto.order ?? 0,
      description: dto.description ?? '',
    };
    const row = await this.prisma.milestone.create({
      data: {
        projectId: dto.projectId,
        name: dto.title,
        version: this.serializeMeta(meta),
      },
    });
    return this.milestoneToCard(row, meta);
  }

  async updateCard(id: string, userId: string, dto: UpdateRoadmapCardDto) {
    const existing = await this.prisma.milestone.findUniqueOrThrow({ where: { id } });
    await this.assertProjectAccess(existing.projectId, userId);
    const meta = this.parseMeta(existing.version, existing.projectId);
    if (dto.columnId != null) meta.columnId = dto.columnId;
    if (dto.order != null) meta.order = dto.order;
    if (dto.description != null) meta.description = dto.description;

    const row = await this.prisma.milestone.update({
      where: { id },
      data: {
        name: dto.title ?? existing.name,
        version: this.serializeMeta(meta),
        releasedAt: dto.columnId?.endsWith(':done') ? new Date() : existing.releasedAt,
      },
    });
    return this.milestoneToCard(row, meta);
  }

  async deleteCard(id: string, userId: string) {
    const existing = await this.prisma.milestone.findUniqueOrThrow({ where: { id } });
    await this.assertProjectAccess(existing.projectId, userId);
    await this.prisma.milestone.delete({ where: { id } });
  }
}
