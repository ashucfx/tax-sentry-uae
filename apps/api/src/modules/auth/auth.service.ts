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
import { JwtStrategy } from './jwt.strategy';
import { authenticator } from 'otplib';

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
    private readonly jwtStrategy: JwtStrategy,
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
    const session = await this.prisma.session.findUnique({ where: { tokenHash }, select: { userId: true } }).catch(() => null);
    if (session?.userId) {
      this.jwtStrategy.invalidateUser(session.userId);
    }
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
    this.jwtStrategy.invalidateUser(userId);
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



  // ── Get current user profile ────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
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
    return user;
  }

  // ── Update user profile ─────────────────────────────────────────────────────
  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    const fullUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { orgId: true } });
    if (fullUser) {
      await this.prisma.auditLog.create({
        data: {
          orgId: fullUser.orgId,
          actorId: userId,
          action: 'USER_PROFILE_UPDATED',
          entity: 'User',
          entityId: userId,
          afterJson: dto,
        },
      }).catch(() => {});
    }

    return user;
  }

  // ── List active sessions ────────────────────────────────────────────────────
  async listSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return sessions.map((s) => ({
      ...s,
      deviceLabel: this.parseDeviceLabel(s.userAgent ?? ''),
    }));
  }

  // ── Revoke a specific session ───────────────────────────────────────────────
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  // ── MFA: Enroll ─────────────────────────────────────────────────────────────
  async enrollMfa(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email ?? userId, 'TaxSentry', secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret },
    });

    return { secret, otpauthUrl, qrCodeData: otpauthUrl };
  }

  // ── MFA: Verify enrollment ──────────────────────────────────────────────────
  async verifyMfaEnrollment(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { totpSecret: true, mfaEnabled: true, orgId: true },
    });

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }
    if (!user.totpSecret) {
      throw new BadRequestException('MFA enrollment not started — call /auth/mfa/enroll first');
    }

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    const plainCodes = Array.from({ length: 10 }, () => randomBytes(4).toString('hex'));
    const hashedCodes = plainCodes.map((c) => sha256(c));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        totpVerifiedAt: new Date(),
        totpBackupCodes: hashedCodes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        actorId: userId,
        action: 'MFA_ENABLED',
        entity: 'User',
        entityId: userId,
        afterJson: { mfaEnabled: true },
      },
    }).catch(() => {});

    return { backupCodes: plainCodes };
  }

  // ── MFA: Disable ─────────────────────────────────────────────────────────────
  async disableMfa(userId: string, dto: { code?: string; backupCode?: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { totpSecret: true, mfaEnabled: true, totpBackupCodes: true, orgId: true },
    });

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    let verified = false;

    if (dto.code && user.totpSecret) {
      verified = authenticator.verify({ token: dto.code, secret: user.totpSecret });
    } else if (dto.backupCode) {
      const hashedInput = sha256(dto.backupCode);
      verified = user.totpBackupCodes.includes(hashedInput);
      if (verified) {
        // consume the used backup code
        await this.prisma.user.update({
          where: { id: userId },
          data: { totpBackupCodes: user.totpBackupCodes.filter((c) => c !== hashedInput) },
        });
      }
    }

    if (!verified) {
      throw new UnauthorizedException('Invalid code or backup code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        totpSecret: null,
        totpBackupCodes: [],
        totpVerifiedAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        actorId: userId,
        action: 'MFA_DISABLED',
        entity: 'User',
        entityId: userId,
        afterJson: { mfaEnabled: false },
      },
    }).catch(() => {});

    return { message: 'MFA disabled successfully' };
  }

  // ── MFA: Regenerate backup codes ────────────────────────────────────────────
  async regenerateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { mfaEnabled: true, orgId: true },
    });

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    const plainCodes = Array.from({ length: 10 }, () => randomBytes(4).toString('hex'));
    const hashedCodes = plainCodes.map((c) => sha256(c));

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpBackupCodes: hashedCodes },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        actorId: userId,
        action: 'MFA_BACKUP_CODES_REGENERATED',
        entity: 'User',
        entityId: userId,
        afterJson: {},
      },
    }).catch(() => {});

    return { backupCodes: plainCodes };
  }

  // ── Email change: Request ───────────────────────────────────────────────────
  async requestEmailChange(userId: string, orgId: string, newEmail: string) {
    // Check no one in the same org already has this email
    const conflict = await this.prisma.user.findFirst({
      where: { orgId, email: newEmail },
    });
    if (conflict) {
      throw new ConflictException('This email is already in use within your organization');
    }

    // Generate 6-char alphanumeric token
    const plainToken = randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
    const tokenHash = sha256(plainToken);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        pendingEmailToken: tokenHash,
        pendingEmailExpiry: expiry,
      },
    });

    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');

    try {
      const Resend = (await import('resend')).Resend;
      const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
      await resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM', 'hello@gettaxsentry.com'),
        to: newEmail,
        subject: 'Confirm your new email address — TaxSentry',
        html: `<p>Your email change verification code is: <strong>${plainToken}</strong></p>
               <p>This code expires in 24 hours. If you did not request this, you can safely ignore it.</p>`,
      });
    } catch (err: any) {
      this.logger.warn(`Email delivery failed for email-change request (user ${userId}): ${err.message}. Token: ${plainToken}`);
    }

    return { message: 'Verification email sent' };
  }

  // ── Email change: Confirm ───────────────────────────────────────────────────
  async confirmEmailChange(userId: string, token: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        pendingEmail: true,
        pendingEmailToken: true,
        pendingEmailExpiry: true,
        orgId: true,
        email: true,
      },
    });

    if (!user.pendingEmail || !user.pendingEmailToken || !user.pendingEmailExpiry) {
      throw new BadRequestException('No pending email change found');
    }

    if (user.pendingEmailExpiry < new Date()) {
      throw new BadRequestException('Email change token has expired');
    }

    const tokenHash = sha256(token.toUpperCase());
    if (tokenHash !== user.pendingEmailToken) {
      throw new UnauthorizedException('Invalid verification token');
    }

    const oldEmail = user.email;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiry: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        actorId: userId,
        action: 'EMAIL_CHANGED',
        entity: 'User',
        entityId: userId,
        beforeJson: { email: oldEmail },
        afterJson: { email: user.pendingEmail },
      },
    }).catch(() => {});

    return { message: 'Email updated successfully' };
  }

  private parseDeviceLabel(userAgent: string): string {
    if (!userAgent) return 'Unknown device';
    if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Mobile browser';
    if (/iPad|Tablet/i.test(userAgent)) return 'Tablet browser';
    if (/Chrome/i.test(userAgent)) return 'Chrome on Desktop';
    if (/Firefox/i.test(userAgent)) return 'Firefox on Desktop';
    if (/Safari/i.test(userAgent)) return 'Safari on Desktop';
    if (/Edge/i.test(userAgent)) return 'Edge on Desktop';
    return 'Desktop browser';
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
