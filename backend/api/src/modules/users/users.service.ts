import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { UpdateProfileDto } from './users.dto.js';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  async findAll(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
      orderBy: { role: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (exists) throw new ConflictException('Email уже используется');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        avatarUrl: dto.avatarUrl,
      },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
  }
}
