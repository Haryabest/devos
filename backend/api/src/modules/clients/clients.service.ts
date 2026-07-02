import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { parseClientExtra, serializeClientExtra } from '../documents/documents.mapper.js';

export interface UpsertClientDto {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  contactList?: unknown[];
  contracts?: unknown[];
  files?: unknown[];
  notes?: string;
}

@Injectable()
export class ClientsService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
  }

  private toApi(client: {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    email: string | null;
    phone: string | null;
    contacts: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const extra = parseClientExtra(client.contacts);
    return {
      id: client.id,
      workspaceId: client.workspaceId,
      name: client.name,
      description: client.description ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      contacts: extra.contactList ?? [],
      contracts: extra.contracts ?? [],
      files: extra.files ?? [],
      notes: extra.notes ?? '',
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  async list(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const clients = await this.prisma.client.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return clients.map((c) => this.toApi(c));
  }

  async create(workspaceId: string, userId: string, dto: UpsertClientDto) {
    await this.assertMember(workspaceId, userId);
    const client = await this.prisma.client.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        email: dto.email,
        phone: dto.phone,
        contacts: serializeClientExtra({
          contactList: dto.contactList,
          contracts: dto.contracts,
          files: dto.files,
          notes: dto.notes,
        }),
      },
    });
    return this.toApi(client);
  }

  async update(id: string, userId: string, dto: Partial<UpsertClientDto>) {
    const existing = await this.prisma.client.findUniqueOrThrow({ where: { id } });
    await this.assertMember(existing.workspaceId, userId);
    const prev = parseClientExtra(existing.contacts);
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        email: dto.email,
        phone: dto.phone,
        contacts: serializeClientExtra({
          contactList: dto.contactList ?? prev.contactList,
          contracts: dto.contracts ?? prev.contracts,
          files: dto.files ?? prev.files,
          notes: dto.notes ?? prev.notes,
        }),
      },
    });
    return this.toApi(client);
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.client.findUniqueOrThrow({ where: { id } });
    await this.assertMember(existing.workspaceId, userId);
    await this.prisma.client.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    });
    await this.prisma.client.delete({ where: { id } });
  }
}
