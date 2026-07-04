import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { WorkspacesService } from './workspaces.service.js';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './workspaces.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    @Inject(WorkspacesService) private readonly ws: WorkspacesService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.ws.create(userId, dto);
  }

  @Get()
  async list(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.ws.listForUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.ws.findOne(id, userId);
  }

  @Post(':id/members')
  async inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.ws.inviteMember(id, userId, dto);
  }

  @Patch(':id/members/:memberId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.ws.updateMemberRole(id, userId, memberId, dto.role);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    await this.ws.removeMember(id, userId, memberId);
  }
}
