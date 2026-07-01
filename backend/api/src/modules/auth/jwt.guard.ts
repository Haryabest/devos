import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';

/** Минимальный guard — проверяет Bearer в заголовке, кладёт userId в request. */
@Injectable()
export class JwtGuard {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaClient,
  ) {}

  async authenticate(request: { headers: Record<string, string | undefined>; userId?: string }) {
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Нет токена доступа');
    }

    const token = authHeader.slice(7);
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(token, { secret: env.JWT_ACCESS_SECRET });
    } catch {
      throw new UnauthorizedException('Токен недействителен или истёк');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    request.userId = user.id;
    return user.id;
  }
}
