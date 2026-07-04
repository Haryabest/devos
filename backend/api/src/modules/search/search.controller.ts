import { Controller, Get, Query, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { SearchService } from './search.service.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    @Inject(SearchService) private readonly svc: SearchService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'q', required: true })
  async search(
    @Query('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.search(workspaceId, userId, q);
  }
}
