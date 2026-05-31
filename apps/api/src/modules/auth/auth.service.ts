import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FreeZone, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_DAYS = 30;

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(64).toString('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}



  // ── Refresh ─────────────────────────────────────────────────────────────────
  async refresh(rawRefreshToken: string, meta: { ipAddress?: string; userAgent?: string }) {
    const tokenHash = sha256(rawRefreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.isRevoked) {
      // 30-second grace period for concurrent requests (e.g., multiple tabs refreshing simultaneously)
      if (session.revokedAt && Date.now() - session.revokedAt.getTime() < 30 * 1000) {
        this.logger.warn(`Grace period refresh granted for user ${session.userId} (concurrent requests)`);
      } else {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    } else {
      // Rotate: revoke old, issue new — two separate writes (acceptable; old token immediately invalid)
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(session.userId, meta);

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            freeZone: true,
            tradeLicenseNo: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    return {
      accessToken,
      refreshToken,
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            orgId: user.orgId,
            emailVerified: user.emailVerified,
            org: user.organization,
          }
        : null,
    };
  }

  // ── Logout ──────────────────────────────────────────────────────────────────
  async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;
    const tokenHash = sha256(rawRefreshToken);
    await this.prisma.session
      .updateMany({
        where: { tokenHash, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      })
      .catch(() => {});
  }

  // ── Logout all devices ───────────────────────────────────────────────────────
  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    this.logger.log(`All sessions revoked for user ${userId}`);
  }



  // ── Accept invitation ─────────────────────────────────────────────────────────
  async acceptInvite(
    dto: { token: string; firstName?: string; lastName?: string },
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const tokenHash = sha256(dto.token);
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash } });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    const emailConflict = await this.prisma.user.findFirst({
      where: { email: invitation.email, orgId: invitation.orgId },
    });
    if (emailConflict) throw new ConflictException('An account with this email already exists in this organization');

    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          orgId: invitation.orgId,
          email: invitation.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: invitation.role,
          emailVerified: true, // invitation email was already confirmed by clicking the link
          emailVerifiedAt: new Date(),
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    this.logger.log(`Invitation accepted: ${user.email} org=${invitation.orgId} role=${invitation.role}`);

    const { accessToken, refreshToken } = await this.issueTokenPair(user.id, meta);
    const org = await this.prisma.organization.findUnique({
      where: { id: invitation.orgId },
      select: { id: true, name: true, freeZone: true, tradeLicenseNo: true, subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true, currentPeriodEnd: true },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, orgId: user.orgId, emailVerified: true, org },
    };
  }



  // ── Private helpers ─────────────────────────────────────────────────────────

  private issueAccessToken(user: { id: string; orgId: string; email: string | null; role: string }) {
    return this.jwtService.sign({ sub: user.id, orgId: user.orgId, email: user.email, role: user.role });
  }

  private async issueTokenPair(
    userId: string,
    meta: { ipAddress?: string; userAgent?: string; deviceInfo?: string },
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // ── Device Fingerprinting & IP Tracking (Security Alert) ──
    const lastSession = await this.prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastSession) {
      // Harden against missing headers to prevent false positive security alerts
      const isNewIp = meta.ipAddress && lastSession.ipAddress && lastSession.ipAddress !== meta.ipAddress;
      const isNewDevice = meta.userAgent && lastSession.userAgent && lastSession.userAgent !== meta.userAgent;
      
      if (isNewIp || isNewDevice) {
        this.logger.warn(`Security Alert: User ${userId} signed in from a new context. IP: ${meta.ipAddress || 'unknown'}, Device: ${meta.userAgent || 'unknown'}`);
        await this.prisma.auditLog.create({
          data: {
            orgId: user.orgId,
            actorId: user.id,
            action: 'SECURITY_NEW_DEVICE_LOGIN',
            entity: 'User',
            entityId: user.id,
            beforeJson: { ip: lastSession.ipAddress, agent: lastSession.userAgent },
            afterJson: { ip: meta.ipAddress, agent: meta.userAgent },
          }
        });
      }
    }

    const accessToken = this.issueAccessToken({
      id: user.id,
      orgId: user.orgId,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = generateOpaqueToken();
    const tokenHash = sha256(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        deviceInfo: meta.deviceInfo ?? null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }


}
