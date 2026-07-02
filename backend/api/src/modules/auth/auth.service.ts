import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env.js';
import type { RegisterDto, LoginDto, ChangePasswordDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  // ── register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, meta: { userAgent?: string; ip?: string } = {}) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email уже используется');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    const slugBase = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'workspace';
    await this.prisma.workspace.create({
      data: {
        name: `${dto.name} Workspace`,
        slug: `${slugBase}-${user.id.slice(-6)}`,
        ownerId: user.id,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });

    const tokens = await this.issueTokens(user.id, meta);
    return { user, tokens };
  }

  // ── login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, meta: { userAgent?: string; ip?: string } = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, name: true, avatarUrl: true, passwordHash: true },
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Неверный email или пароль');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Неверный email или пароль');

    const { passwordHash: _ph, ...safeUser } = user;
    const tokens = await this.issueTokens(user.id, meta);
    return { user: safeUser, tokens };
  }

  // ── refresh ────────────────────────────────────────────────────────────────

  async refresh(rawToken: string, meta: { userAgent?: string; ip?: string } = {}) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(rawToken, { secret: env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Refresh token невалиден или истёк');
    }

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token отозван или истёк');
    }

    // Rotate
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    const tokens = await this.issueTokens(user.id, meta);
    return { user, tokens };
  }

  // ── change password ────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user.passwordHash) {
      throw new BadRequestException('У аккаунта нет пароля');
    }

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Неверный текущий пароль');

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  // ── me ─────────────────────────────────────────────────────────────────────

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }

  // ── logout ─────────────────────────────────────────────────────────────────

  async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken
      .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async issueTokens(userId: string, meta: { userAgent?: string; ip?: string }) {
    const accessToken = this.jwt.sign({ sub: userId }, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_TTL,
    });

    const rawRefresh = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefresh);
    const expiresAt = this.addDuration(env.JWT_REFRESH_TTL);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, userAgent: meta.userAgent, ip: meta.ip },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private addDuration(ttl: string): Date {
    const num = parseInt(ttl, 10);
    const unit = ttl.slice(-1);
    const ms =
      unit === 'd' ? num * 86_400_000 :
      unit === 'h' ? num * 3_600_000 :
      unit === 'm' ? num * 60_000 :
      num * 1000;
    return new Date(Date.now() + ms);
  }
}
