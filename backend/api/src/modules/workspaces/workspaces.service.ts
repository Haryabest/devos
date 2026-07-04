import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaClient, WorkspaceRole } from '@prisma/client';
import type { CreateWorkspaceDto, InviteMemberDto } from './workspaces.dto.js';

@Injectable()
export class WorkspacesService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

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

  private async assertAdmin(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m || (m.role !== 'OWNER' && m.role !== 'ADMIN')) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return m;
  }

  async inviteMember(workspaceId: string, actorId: string, dto: InviteMemberDto) {
    await this.assertAdmin(workspaceId, actorId);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (existing) throw new BadRequestException('Пользователь уже в воркспейсе');

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: dto.role,
        joinedAt: new Date(),
      },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async updateMemberRole(workspaceId: string, actorId: string, memberId: string, role: WorkspaceRole) {
    await this.assertAdmin(workspaceId, actorId);
    const member = await this.prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!member || member.workspaceId !== workspaceId) throw new NotFoundException('Участник не найден');
    if (member.role === 'OWNER') throw new BadRequestException('Нельзя изменить роль владельца');

    const actor = await this.prisma.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId, userId: actorId } },
    });
    if (actor.role !== 'OWNER' && role === 'OWNER') {
      throw new ForbiddenException('Только владелец может назначать OWNER');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async removeMember(workspaceId: string, actorId: string, memberId: string) {
    await this.assertAdmin(workspaceId, actorId);
    const member = await this.prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!member || member.workspaceId !== workspaceId) throw new NotFoundException('Участник не найден');
    if (member.role === 'OWNER') throw new BadRequestException('Нельзя удалить владельца');
    if (member.userId === actorId) throw new BadRequestException('Нельзя удалить себя');

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
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
