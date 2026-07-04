import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import type { UpsertWhiteboardDto } from './whiteboards.dto.js';

@Injectable()
export class WhiteboardsService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
  }

  private toApi(whiteboard: {
    id: string;
    projectId: string;
    content: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: whiteboard.id,
      projectId: whiteboard.projectId,
      content: whiteboard.content ?? {},
      createdAt: whiteboard.createdAt.toISOString(),
      updatedAt: whiteboard.updatedAt.toISOString(),
    };
  }

  async list(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const whiteboards = await this.prisma.whiteboard.findMany({
      where: { project: { workspaceId } },
      orderBy: { updatedAt: 'desc' },
    });
    return whiteboards.map((w) => this.toApi(w));
  }

  async getByProjectId(projectId: string, userId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    await this.assertMember(project.workspaceId, userId);
    const whiteboard = await this.prisma.whiteboard.findUnique({ where: { projectId } });
    if (!whiteboard) {
      return {
        id: null,
        projectId,
        content: {},
        createdAt: null,
        updatedAt: null,
      };
    }
    return this.toApi(whiteboard);
  }

  async upsertContent(projectId: string, userId: string, dto: UpsertWhiteboardDto) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    await this.assertMember(project.workspaceId, userId);
    const whiteboard = await this.prisma.whiteboard.upsert({
      where: { projectId },
      create: {
        projectId,
        content: dto.content as Prisma.InputJsonValue,
      },
      update: {
        content: dto.content as Prisma.InputJsonValue,
      },
    });
    return this.toApi(whiteboard);
  }
}
