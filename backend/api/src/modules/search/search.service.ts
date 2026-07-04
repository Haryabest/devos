import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface SearchResult {
  kind: 'task' | 'document' | 'project';
  id: string;
  title: string;
  snippet: string;
  projectId?: string;
  workspaceId: string;
}

@Injectable()
export class SearchService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
  }

  async search(workspaceId: string, userId: string, q: string) {
    await this.assertMember(workspaceId, userId);
    const query = q.trim();
    if (!query) return { results: [] as SearchResult[] };

    const contains = { contains: query, mode: 'insensitive' as const };

    const [tasks, documents, projects] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          project: { workspaceId },
          OR: [{ title: contains }, { description: contains }],
        },
        select: {
          id: true,
          title: true,
          description: true,
          projectId: true,
          project: { select: { workspaceId: true } },
        },
        take: 20,
      }),
      this.prisma.document.findMany({
        where: {
          workspaceId,
          OR: [{ title: contains }, { contentMd: contains }],
        },
        select: { id: true, title: true, contentMd: true, projectId: true, workspaceId: true },
        take: 20,
      }),
      this.prisma.project.findMany({
        where: {
          workspaceId,
          OR: [{ name: contains }, { description: contains }],
        },
        select: { id: true, name: true, description: true, workspaceId: true },
        take: 20,
      }),
    ]);

    const results: SearchResult[] = [
      ...tasks.map((t) => ({
        kind: 'task' as const,
        id: t.id,
        title: t.title,
        snippet: (t.description ?? '').slice(0, 160),
        projectId: t.projectId,
        workspaceId: t.project.workspaceId,
      })),
      ...documents.map((d) => ({
        kind: 'document' as const,
        id: d.id,
        title: d.title,
        snippet: d.contentMd.slice(0, 160),
        projectId: d.projectId ?? undefined,
        workspaceId: d.workspaceId,
      })),
      ...projects.map((p) => ({
        kind: 'project' as const,
        id: p.id,
        title: p.name,
        snippet: (p.description ?? '').slice(0, 160),
        workspaceId: p.workspaceId,
      })),
    ];

    return { results, query };
  }
}
