import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import type { FastifyRequestWithRawBody } from '../../lib/fastify-raw-body.js';
import { IntegrationsService } from './integrations.service.js';
import { ManualTokenDto } from './integrations.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    @Inject(IntegrationsService) private readonly svc: IntegrationsService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequestWithRawBody & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: 'workspaceId', required: true })
  async list(@Query('workspaceId') workspaceId: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.list(workspaceId, userId);
  }

  @Post('github/webhook')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async githubWebhook(
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Headers('x-github-event') githubEvent: string | undefined,
    @Body() body: Record<string, unknown>,
    @Req() req: FastifyRequestWithRawBody,
  ) {
    const rawBody = req.rawBody ?? JSON.stringify(body);
    return this.svc.handleGithubWebhook(rawBody, signature, { ...body, _event: githubEvent });
  }

  @Get(':provider/connect')
  @ApiBearerAuth()
  @ApiQuery({ name: 'workspaceId', required: true })
  async connect(
    @Param('provider') provider: string,
    @Query('workspaceId') workspaceId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.getAuthUrl(provider, workspaceId, userId);
  }

  @Get(':provider/callback')
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.svc.handleCallback(provider, code, state);
  }

  @Post(':provider/token')
  @ApiBearerAuth()
  async manualToken(
    @Param('provider') provider: string,
    @Body() dto: ManualTokenDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.connectManual(provider, dto.workspaceId, userId, dto.token, dto.externalId);
  }

  @Delete(':provider')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiQuery({ name: 'workspaceId', required: true })
  async disconnect(
    @Param('provider') provider: string,
    @Query('workspaceId') workspaceId: string,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    await this.svc.disconnect(provider, workspaceId, userId);
  }
}
