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

  // ── Sign up ─────────────────────────────────────────────────────────────────
  async signup(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const displayName =
      [dto.firstName, dto.lastName].filter(Boolean).join(' ') || dto.email.split('@')[0];
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const org = await this.prisma.organization.create({
      data: {
        name: displayName,
        tradeLicenseNo: `PENDING-${Date.now().toString(36).toUpperCase()}`,
        freeZone: FreeZone.OTHER,
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        orgId: org.id,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.OWNER,
      },
    });

    this.logger.log(`New user registered: ${user.email} org=${org.id}`);

    // Send verification email — non-blocking
    this.sendVerificationEmailForUser(user.id, user.email!).catch((err) =>
      this.logger.error(`Verification email failed: ${(err as Error).message}`),
    );

    return { id: user.id, email: user.email, orgId: user.orgId };
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  async login(
    email: string,
    password: string,
    meta: { ipAddress?: string; userAgent?: string; deviceInfo?: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { email },
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

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses OTP sign-in — use the code-based login');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const secsLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      throw new HttpException(
        { message: `Account locked. Try again in ${secsLeft}s`, code: 'ACCOUNT_LOCKED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= LOCKOUT_MAX_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        },
      });

      if (shouldLock) {
        this.logger.warn(`Account locked after ${attempts} failures: ${email}`);
        throw new HttpException(
          { message: 'Too many failed attempts — account locked for 15 minutes', code: 'ACCOUNT_LOCKED' },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress ?? null,
      },
    });

    const { accessToken, refreshToken } = await this.issueTokenPair(user.id, meta);

    this.logger.log(`Login OK: ${email} ip=${meta.ipAddress ?? '?'}`);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        orgId: user.orgId,
        emailVerified: user.emailVerified,
        org: user.organization,
      },
    };
  }

  // ── Refresh ─────────────────────────────────────────────────────────────────
  async refresh(rawRefreshToken: string, meta: { ipAddress?: string; userAgent?: string }) {
    const tokenHash = sha256(rawRefreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new — two separate writes (acceptable; old token immediately invalid)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

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

  // ── Forgot password ─────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) return; // Always succeed — don't leak whether email exists

    // Invalidate all prior unused reset tokens before issuing a new one
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = generateOpaqueToken();
    const tokenHash = sha256(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    try {
      const Resend = (await import('resend')).Resend;
      const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
      const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
      const resetLink = `${webUrl}/reset-password?token=${rawToken}`;

      await resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM', 'alerts@taxsentry.ae'),
        to: email,
        subject: 'Reset your TaxSentry password',
        html: `<p>Click below to reset your password. The link expires in 1 hour.</p>
               <p><a href="${resetLink}">${resetLink}</a></p>
               <p>If you didn't request this, you can safely ignore this email. Your password has not been changed.</p>`,
      });
    } catch (err) {
      this.logger.error(`Password reset email failed: ${(err as Error).message}`);
    }
  }

  // ── Reset password ──────────────────────────────────────────────────────────
  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = sha256(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`Password reset for user ${record.userId}`);
  }

  // ── Verify email ─────────────────────────────────────────────────────────────
  async verifyEmail(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email verified for user ${record.userId}`);
  }

  // ── Resend verification email ─────────────────────────────────────────────────
  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerified || !user.email) return;
    await this.sendVerificationEmailForUser(user.id, user.email);
  }

  // ── Accept invitation ─────────────────────────────────────────────────────────
  async acceptInvite(
    dto: { token: string; password: string; firstName?: string; lastName?: string },
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

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          orgId: invitation.orgId,
          email: invitation.email,
          passwordHash,
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

  // ── Me ───────────────────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        orgId: true,
        emailVerified: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            tradeLicenseNo: true,
            freeZone: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
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

  private async sendVerificationEmailForUser(userId: string, email: string) {
    // Invalidate any existing unused verification tokens first
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = generateOpaqueToken();
    const tokenHash = sha256(rawToken);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const Resend = (await import('resend')).Resend;
    const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const verifyLink = `${webUrl}/verify-email?token=${rawToken}`;

    await resend.emails.send({
      from: this.config.get<string>('EMAIL_FROM', 'alerts@taxsentry.ae'),
      to: email,
      subject: 'Verify your TaxSentry email address',
      html: `<p>Welcome to TaxSentry. Please verify your email address to get started.</p>
             <p><a href="${verifyLink}">Verify email address</a></p>
             <p>This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>`,
    });
  }
}
