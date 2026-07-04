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
import { RoadmapService } from './roadmap.service.js';
import { CreateRoadmapCardDto, UpdateRoadmapCardDto } from './roadmap.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('roadmap')
@ApiBearerAuth()
@Controller('roadmap')
export class RoadmapController {
  constructor(
    @Inject(RoadmapService) private readonly svc: RoadmapService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  async getBoard(
    @Query('projectId') projectId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.getBoard(projectId, userId);
  }

  @Post('cards')
  async createCard(@Body() dto: CreateRoadmapCardDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.createCard(userId, dto);
  }

  @Patch('cards/:id')
  async updateCard(
    @Param('id') id: string,
    @Body() dto: UpdateRoadmapCardDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.updateCard(id, userId, dto);
  }

  @Delete('cards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCard(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    await this.svc.deleteCard(id, userId);
  }
}
