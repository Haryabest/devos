import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { parseDocPayload, serializeDocPayload } from './documents.mapper.js';
import type { UpsertDocumentDto, UpdateDocumentDto, UpsertFolderDto, UpdateFolderDto } from './documents.dto.js';

@Injectable()
export class DocumentsService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
  }

  private toApi(doc: {
    id: string;
    workspaceId: string;
    projectId: string | null;
    folderId: string | null;
    title: string;
    contentMd: string;
    tags: string[];
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const payload = parseDocPayload(doc.contentMd);
    return {
      id: doc.id,
      workspaceId: doc.workspaceId,
      projectId: doc.projectId,
      folderId: doc.folderId,
      title: doc.title,
      tags: doc.tags,
      version: doc.version,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      ...payload,
    };
  }

  async list(workspaceId: string, userId: string, projectId?: string) {
    await this.assertMember(workspaceId, userId);
    const docs = await this.prisma.document.findMany({
      where: { workspaceId, ...(projectId ? { projectId } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return docs.map((d) => this.toApi(d));
  }

  async listFolders(workspaceId: string, userId: string, projectId?: string) {
    await this.assertMember(workspaceId, userId);
    const folders = await this.prisma.documentFolder.findMany({
      where: { workspaceId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'asc' },
    });
    return folders.map((f) => ({
      id: f.id,
      workspaceId: f.workspaceId,
      projectId: f.projectId,
      parentId: f.parentId,
      name: f.name,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async create(workspaceId: string, userId: string, dto: UpsertDocumentDto) {
    await this.assertMember(workspaceId, userId);
    const doc = await this.prisma.document.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        folderId: dto.folderId ?? null,
        title: dto.title,
        contentMd: serializeDocPayload(dto.payload),
        tags: dto.tags ?? [],
        version: 1,
      },
    });
    return this.toApi(doc);
  }

  async update(id: string, userId: string, dto: UpdateDocumentDto) {
    const existing = await this.prisma.document.findUniqueOrThrow({ where: { id } });
    await this.assertMember(existing.workspaceId, userId);

    let contentMd = existing.contentMd;
    let version = existing.version;
    if (dto.payload) {
      const prev = parseDocPayload(existing.contentMd);
      const nextContent = dto.payload.content ?? prev.content ?? '';
      const prevContent = prev.content ?? '';
      if (nextContent !== prevContent || (dto.title && dto.title !== existing.title)) {
        await this.prisma.documentRevision.create({
          data: {
            documentId: id,
            version: existing.version,
            contentMd: existing.contentMd,
            authorId: userId,
          },
        });
        version = existing.version + 1;
      }
      contentMd = serializeDocPayload({ ...prev, ...dto.payload });
    }

    const doc = await this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title,
        folderId: dto.folderId === undefined ? undefined : dto.folderId,
        tags: dto.tags,
        contentMd,
        version,
      },
    });
    return this.toApi(doc);
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.document.findUniqueOrThrow({ where: { id } });
    await this.assertMember(existing.workspaceId, userId);
    await this.prisma.document.delete({ where: { id } });
  }

  async createFolder(workspaceId: string, userId: string, dto: UpsertFolderDto) {
    await this.assertMember(workspaceId, userId);
    const folder = await this.prisma.documentFolder.create({
      data: {
        workspaceId,
        projectId: dto.projectId,
        parentId: dto.parentId ?? null,
        name: dto.name,
      },
    });
    return {
      id: folder.id,
      workspaceId: folder.workspaceId,
      projectId: folder.projectId,
      parentId: folder.parentId,
      name: folder.name,
      createdAt: folder.createdAt.toISOString(),
    };
  }

  async updateFolder(id: string, userId: string, dto: UpdateFolderDto) {
    const existing = await this.prisma.documentFolder.findUniqueOrThrow({ where: { id } });
    await this.assertMember(existing.workspaceId, userId);
    const folder = await this.prisma.documentFolder.update({
      where: { id },
      data: {
        name: dto.name,
        parentId: dto.parentId === undefined ? undefined : dto.parentId,
      },
    });
    return {
      id: folder.id,
      workspaceId: folder.workspaceId,
      projectId: folder.projectId,
      parentId: folder.parentId,
      name: folder.name,
      createdAt: folder.createdAt.toISOString(),
    };
  }

  async removeFolder(id: string, userId: string) {
    const existing = await this.prisma.documentFolder.findUniqueOrThrow({ where: { id } });
    await this.assertMember(existing.workspaceId, userId);
    await this.prisma.documentFolder.delete({ where: { id } });
  }
}
