import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FreeZone, UserRole } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(64).toString('hex');
}

interface CreateOrgDto {
  name: string;
  tradeLicenseNo: string;
  freeZone: FreeZone;
  taxRegistrationNo?: string;
  taxPeriodStart: string;
  taxPeriodEnd: string;
  primaryActivityCode?: string;
}

interface ProvisionOrgDto {
  name: string;
  tradeLicenseNo: string;
  freeZone: FreeZone;
}

interface SetupOrgDto {
  name: string;
  tradeLicenseNo: string;
  freeZone: FreeZone;
  taxRegistrationNo?: string;
  taxPeriodStart: string;
  taxPeriodEnd: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Provision a minimal org record during sign-up (no TaxPeriod yet).
   * The user completes onboarding to provide real details + create TaxPeriod.
   */
  async provisionOrg(dto: ProvisionOrgDto) {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        tradeLicenseNo: dto.tradeLicenseNo,
        freeZone: dto.freeZone,
        subscriptionStatus: 'TRIALING',
        subscriptionTier: 'STARTER',
        trialEndsAt,
        currentPeriodEnd: trialEndsAt,
      },
    });
  }

  /**
   * Complete org setup during onboarding — updates real details and creates
   * the first TaxPeriod. Idempotent: safe to call if TaxPeriod already exists.
   * Does NOT reset trial period — preserves the original trial start date.
   */
  async setupOrg(orgId: string, dto: SetupOrgDto) {
    const [org] = await Promise.all([
      this.prisma.organization.update({
        where: { id: orgId },
        data: {
          name: dto.name,
          tradeLicenseNo: dto.tradeLicenseNo,
          freeZone: dto.freeZone,
          taxRegistrationNo: dto.taxRegistrationNo,
          // Keep existing trial period, don't reset it
        },
      }),
    ]);

    // Create first TaxPeriod if none exists
    const existing = await this.prisma.taxPeriod.findFirst({ where: { orgId } });
    if (!existing) {
      await this.prisma.taxPeriod.create({
        data: {
          orgId,
          startDate: new Date(dto.taxPeriodStart),
          endDate: new Date(dto.taxPeriodEnd),
          status: 'OPEN',
          ruleVersionId: 'CD100-2023-v1',
        },
      });
    }

    return this.findById(orgId);
  }

  async create(dto: CreateOrgDto) {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        tradeLicenseNo: dto.tradeLicenseNo,
        freeZone: dto.freeZone,
        taxRegistrationNo: dto.taxRegistrationNo,
        primaryActivityCode: dto.primaryActivityCode,
        taxPeriods: {
          create: {
            startDate: new Date(dto.taxPeriodStart),
            endDate: new Date(dto.taxPeriodEnd),
            status: 'OPEN',
            ruleVersionId: 'CD100-2023-v1',
          },
        },
      },
      include: { taxPeriods: true },
    });

    return org;
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        taxPeriods: { orderBy: { startDate: 'desc' } },
        activityDeclarations: { include: { activityCatalog: true } },
        integrations: { select: { provider: true, isActive: true, lastSyncAt: true } },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, updates: Partial<CreateOrgDto>) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        name: updates.name,
        taxRegistrationNo: updates.taxRegistrationNo,
        primaryActivityCode: updates.primaryActivityCode,
      },
    });
  }

  async getActivityDeclarations(orgId: string) {
    return this.prisma.activityDeclaration.findMany({
      where: { orgId },
      include: { activityCatalog: true },
    });
  }

  async declareActivity(orgId: string, activityCode: string) {
    return this.prisma.activityDeclaration.upsert({
      where: { orgId_activityCode: { orgId, activityCode } },
      update: {},
      create: { orgId, activityCode },
    });
  }

  async inviteUser(orgId: string, invitedBy: string, email: string, role: UserRole) {
    // Block inviting OWNER — only one owner allowed per org
    if (role === UserRole.OWNER) {
      throw new BadRequestException('Cannot invite a user with OWNER role');
    }

    // Block inviting an already-active user in this org
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing?.orgId === orgId) {
      throw new ConflictException('This user is already a member of your organization');
    }
    if (existing) {
      throw new ConflictException('This email is already registered with another organization');
    }

    // Invalidate any prior pending invitation for this email+org
    await this.prisma.invitation.updateMany({
      where: { orgId, email, acceptedAt: null },
      data: { expiresAt: new Date() }, // expire immediately
    });

    const rawToken = generateOpaqueToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.invitation.upsert({
      where: { orgId_email: { orgId, email } },
      update: { tokenHash, expiresAt, acceptedAt: null, role, invitedBy },
      create: { orgId, email, role, tokenHash, expiresAt, invitedBy },
    });

    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const inviteLink = `${webUrl}/accept-invite?token=${rawToken}`;

    try {
      const Resend = (await import('resend')).Resend;
      const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
      await resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM', 'alerts@taxsentry.ae'),
        to: email,
        subject: `You've been invited to join ${org?.name ?? 'TaxSentry'}`,
        html: `<p>You have been invited to join <strong>${org?.name ?? 'an organization'}</strong> on TaxSentry as <strong>${role}</strong>.</p>
               <p><a href="${inviteLink}">Accept invitation</a></p>
               <p>This invitation expires in 7 days. If you did not expect this, you can safely ignore it.</p>`,
      });
    } catch (err: any) {
      throw new BadRequestException(`Invitation created but email delivery failed: ${err.message}`);
    }

    return { message: `Invitation sent to ${email}` };
  }

  async listInvitations(orgId: string) {
    return this.prisma.invitation.findMany({
      where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(orgId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, orgId, acceptedAt: null },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { expiresAt: new Date() }, // expire immediately = revoked
    });
  }
}
