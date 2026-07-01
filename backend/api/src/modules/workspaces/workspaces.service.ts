import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { CreateWorkspaceDto } from './workspaces.dto.js';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaClient) {}

  private slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    let i = 0;
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${base}-${++i}`;
    }
    return slug;
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    const baseSlug = dto.slug ?? this.slugify(dto.name);
    const slug = await this.uniqueSlug(baseSlug);

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true, projects: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
        },
        _count: { select: { projects: true, clients: true } },
      },
    });
    if (!ws) throw new NotFoundException();
    const isMember = ws.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException();
    return ws;
  }
}
