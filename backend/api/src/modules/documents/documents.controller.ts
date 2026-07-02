import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { DocumentsService, type UpsertDocumentDto, type UpsertFolderDto } from './documents.service.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(
    @Inject(DocumentsService) private readonly svc: DocumentsService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get('documents')
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'projectId', required: false })
  async listDocs(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId: string | undefined,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.list(workspaceId, userId, projectId);
  }

  @Post('documents')
  @ApiQuery({ name: 'workspaceId', required: true })
  async createDoc(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpsertDocumentDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.create(workspaceId, userId, dto);
  }

  @Patch('documents/:id')
  async updateDoc(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertDocumentDto>,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.update(id, userId, dto);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDoc(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    await this.svc.remove(id, userId);
  }

  @Get('document-folders')
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'projectId', required: false })
  async listFolders(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId: string | undefined,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.listFolders(workspaceId, userId, projectId);
  }

  @Post('document-folders')
  @ApiQuery({ name: 'workspaceId', required: true })
  async createFolder(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpsertFolderDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.createFolder(workspaceId, userId, dto);
  }

  @Patch('document-folders/:id')
  async updateFolder(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertFolderDto>,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.updateFolder(id, userId, dto);
  }

  @Delete('document-folders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFolder(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    await this.svc.removeFolder(id, userId);
  }
}
