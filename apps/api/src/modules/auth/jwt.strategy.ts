import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LRUCache } from 'lru-cache';

interface JwtPayload {
  sub: string;
  orgId: string;
  email: string | null; // null for phone-only OTP users
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly userCache = new LRUCache<string, any>({
    max: 1000,
    ttl: 60 * 1000, // 60 seconds
  });

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      issuer: 'taxsentry-api',
      audience: 'taxsentry-client',
    });
  }

  async validate(payload: JwtPayload) {
    const cachedUser = this.userCache.get(payload.sub);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        orgId: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    this.userCache.set(payload.sub, user);
    return user;
  }
}
