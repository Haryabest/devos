import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { StorageService } from './storage.service.js';

@Injectable()
export class FilesService {
  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException();
  }

  async list(workspaceId: string, userId: string, projectId?: string) {
    await this.assertMember(workspaceId, userId);
    return this.prisma.file.findMany({
      where: { workspaceId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    workspaceId: string,
    userId: string,
    file: { filename: string; mimetype: string; buffer: Buffer },
    opts: { projectId?: string; taskId?: string },
  ) {
    await this.assertMember(workspaceId, userId);
    const storageKey = `${workspaceId}/${randomUUID()}-${file.filename}`;
    await this.storage.put(storageKey, file.buffer, file.mimetype);
    return this.prisma.file.create({
      data: {
        workspaceId,
        projectId: opts.projectId,
        taskId: opts.taskId,
        name: file.filename,
        mimeType: file.mimetype,
        size: file.buffer.length,
        storageKey,
      },
    });
  }

  async download(id: string, userId: string) {
    const row = await this.prisma.file.findUniqueOrThrow({ where: { id } });
    await this.assertMember(row.workspaceId, userId);
    const { body, size } = await this.storage.get(row.storageKey);
    return { row, body, size };
  }

  async remove(id: string, userId: string) {
    const row = await this.prisma.file.findUniqueOrThrow({ where: { id } });
    await this.assertMember(row.workspaceId, userId);
    await this.storage.remove(row.storageKey);
    await this.prisma.file.delete({ where: { id } });
  }

  async getByKey(storageKey: string, userId: string) {
    const row = await this.prisma.file.findUnique({ where: { storageKey } });
    if (!row) throw new NotFoundException();
    await this.assertMember(row.workspaceId, userId);
    return this.storage.get(row.storageKey);
  }
}
