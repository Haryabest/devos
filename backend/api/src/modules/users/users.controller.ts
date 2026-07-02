import { Controller, Get, Patch, Body, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { UsersService } from './users.service.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { UpdateProfileDto } from './users.dto.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @Inject(UsersService) private readonly svc: UsersService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Профиль текущего пользователя' })
  async me(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
    return this.svc.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль' })
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
    return this.svc.updateProfile(userId, dto);
  }
}
