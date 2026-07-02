import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';
import { RegisterDto, LoginDto, RefreshDto, ChangePasswordDto } from './auth.dto.js';

function meta(req: FastifyRequest) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  async register(@Body() dto: RegisterDto, @Req() req: FastifyRequest) {
    return this.auth.register(dto, meta(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход по email/паролю' })
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    return this.auth.login(dto, meta(req));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить access-token по refresh-token' })
  async refresh(@Body() dto: RefreshDto, @Req() req: FastifyRequest) {
    return this.auth.refresh(dto.refreshToken, meta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Выход (отзыв refresh-token)' })
  async logout(@Body() dto: Partial<RefreshDto>) {
    await this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Текущий пользователь' })
  async me(@Req() req: FastifyRequest & { userId?: string }) {
    await this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
    return this.auth.me(req.userId!);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Сменить пароль' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    await this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
    await this.auth.changePassword(req.userId!, dto);
  }
}
