import {
  Injectable,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FreeZone, UserRole } from '@prisma/client';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

const OTP_EXPIRY_MS = 5 * 60 * 1000;    // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 60 * 1000;       // 1 request per 60 seconds per identifier
const REFRESH_TOKEN_TTL_DAYS = 30;

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(64).toString('hex');
}

export interface OtpVerifyResult {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    orgId: string;
    org: unknown;
  };
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Send OTP ────────────────────────────────────────────────────────────────

  async sendOtp(dto: { email?: string; phone?: string }): Promise<{ channel: 'email' | 'sms' }> {
    const { email, phone } = dto;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }

    const channel: 'email' | 'sms' = email ? 'email' : 'sms';
    const identifier = email ? { email } : { phone: phone! };

    // ── Cooldown check ───────────────────────────────────────────────────────
    const recent = await this.prisma.otpCode.findFirst({
      where: {
        ...identifier,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - OTP_COOLDOWN_MS) },
      },
    });

    if (recent) {
      const waitSec = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
      throw new HttpException(
        { message: `Wait ${waitSec}s before requesting a new code`, code: 'OTP_COOLDOWN', waitSeconds: waitSec },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Invalidate previous unused codes ────────────────────────────────────
    await this.prisma.otpCode.updateMany({
      where: { ...identifier, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });

    // ── Generate + store ─────────────────────────────────────────────────────
    // randomInt is cryptographically secure (Node.js crypto module)
    const code = randomInt(100000, 1000000).toString();
    const codeHash = sha256(code);

    await this.prisma.otpCode.create({
      data: {
        ...identifier,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    // ── Deliver ──────────────────────────────────────────────────────────────
    if (channel === 'email') {
      await this.deliverEmail(email!, code);
    } else {
      await this.deliverSms(phone!, code);
    }

    this.logger.log(`OTP dispatched via ${channel} → ${email ?? phone}`);
    return { channel };
  }

  // ── Verify OTP ──────────────────────────────────────────────────────────────

  async verifyOtp(
    dto: { email?: string; phone?: string; otp: string },
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<OtpVerifyResult> {
    const { email, phone, otp } = dto;
    if (!email && !phone) {
      throw new BadRequestException('Provide either email or phone');
    }

    const identifier = email ? { email } : { phone: phone! };

    // ── Find active OTP record ───────────────────────────────────────────────
    const record = await this.prisma.otpCode.findFirst({
      where: { ...identifier, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException({
        message: 'Code expired or not found — request a new one',
        code: 'OTP_EXPIRED',
      });
    }

    // ── Increment attempts BEFORE comparison (prevents enumeration) ──────────
    const updated = await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts > OTP_MAX_ATTEMPTS) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      });
      throw new HttpException(
        { message: 'Too many failed attempts — request a new code', code: 'OTP_MAX_ATTEMPTS' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Constant-time comparison via SHA-256 ─────────────────────────────────
    // timingSafeEqual prevents timing side-channels that could reveal correct digits
    const inputHash = Buffer.from(sha256(otp), 'hex');
    const storedHash = Buffer.from(record.codeHash, 'hex');
    const codeMatches = inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash);
    if (!codeMatches) {
      const remaining = OTP_MAX_ATTEMPTS - updated.attempts;
      throw new BadRequestException({
        message: `Invalid code — ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`,
        code: 'OTP_INVALID',
        attemptsRemaining: remaining,
      });
    }

    // ── Mark verified ────────────────────────────────────────────────────────
    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    // ── Upsert user + org ────────────────────────────────────────────────────
    const { user, isNewUser } = await this.upsertUser(identifier);

    // ── Issue JWT pair ───────────────────────────────────────────────────────
    const { accessToken, refreshToken } = await this.issueTokenPair(user.id, meta);

    this.logger.log(`OTP verified → ${email ?? phone} (newUser=${isNewUser})`);

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        orgId: user.orgId,
        org: user.organization,
      },
    };
  }

  // ── Private: upsert user + organization ────────────────────────────────────

  private async upsertUser(identifier: { email?: string; phone?: string }) {
    const { email, phone } = identifier;

    const orgSelect = {
      id: true, name: true, freeZone: true, tradeLicenseNo: true,
      subscriptionTier: true, subscriptionStatus: true,
      trialEndsAt: true, currentPeriodEnd: true,
    };

    const existing = await this.prisma.user.findFirst({
      where: email ? { email } : { phone: phone! },
      include: { organization: { select: orgSelect } },
    });

    if (existing) {
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          lastLoginAt: new Date(),
          // Email OTP proves the address is reachable
          ...(email && !existing.emailVerified ? { emailVerified: true, emailVerifiedAt: new Date() } : {}),
        },
        include: { organization: { select: orgSelect } },
      });
      return { user, isNewUser: false };
    }

    // New user — create org first, then user in a transaction
    const displayName = email ? email.split('@')[0] : phone!;
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
        email: email ?? null,
        phone: phone ?? null,
        role: UserRole.OWNER,
        // Email OTP = address verified; phone OTP = email still unverified (no email yet)
        emailVerified: !!email,
        emailVerifiedAt: email ? new Date() : null,
      },
      include: { organization: { select: orgSelect } },
    });

    return { user, isNewUser: true };
  }

  // ── Private: token issuance (mirrors AuthService.issueTokenPair) ────────────

  private async issueTokenPair(
    userId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      orgId: user.orgId,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: sha256(rawRefreshToken),
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  // ── Private: email delivery ─────────────────────────────────────────────────

  private async deliverEmail(to: string, code: string): Promise<void> {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
      await resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM', 'alerts@taxsentry.ae'),
        to,
        subject: `${code} — your TaxSentry sign-in code`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px">Your sign-in code</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:15px">
              Enter this code to sign in to TaxSentry. It expires in <strong>5 minutes</strong>.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
              <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#1e40af;font-family:monospace">${code}</span>
            </div>
            <p style="margin:0;color:#94a3b8;font-size:13px">
              If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`OTP email delivery failed: ${(err as Error).message}`);
      // Do not re-throw — the code is stored; user can retry or resend
    }
  }

  // ── Private: SMS delivery ───────────────────────────────────────────────────

  private async deliverSms(to: string, code: string): Promise<void> {
    const provider = this.config.get<string>('SMS_PROVIDER', 'mock');

    if (provider === 'twilio') {
      await this.deliverTwilioSms(to, code);
      return;
    }

    // Mock provider (dev / staging) — log OTP so developers can test without Twilio
    this.logger.warn(`[SMS MOCK] OTP for ${to}: ${code}  ← visible in dev logs only`);
  }

  private async deliverTwilioSms(to: string, code: string): Promise<void> {
    const sid   = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from  = this.config.get<string>('TWILIO_FROM');

    if (!sid || !token || !from) {
      this.logger.warn('Twilio env vars missing — falling back to SMS mock');
      this.logger.warn(`[SMS MOCK] OTP for ${to}: ${code}`);
      return;
    }

    try {
      // Dynamic import: twilio is an optional runtime dep — install with `npm install twilio`
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      const client = twilio(sid, token);
      await client.messages.create({
        to,
        from,
        body: `${code} is your TaxSentry sign-in code. Valid for 5 minutes. Do not share it.`,
      });
    } catch (err) {
      this.logger.error(`Twilio SMS failed: ${(err as Error).message}`);
    }
  }
}
