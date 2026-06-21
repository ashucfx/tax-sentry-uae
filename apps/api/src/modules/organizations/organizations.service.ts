import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
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
      const taxPeriodStart = new Date(dto.taxPeriodStart);
      const taxPeriodEnd = new Date(dto.taxPeriodEnd);

      if (taxPeriodEnd <= taxPeriodStart) {
        throw new BadRequestException('Tax period end date must be after start date');
      }

      await this.prisma.taxPeriod.create({
        data: {
          orgId,
          startDate: taxPeriodStart,
          endDate: taxPeriodEnd,
          status: 'OPEN',
          ruleVersionId: 'CD100-2023-v1',
        },
      });

      // Insert an empty RiskSnapshot so the user has a baseline from day 1
      await this.prisma.riskSnapshot.create({
        data: {
          orgId,
          snapshotDate: new Date(),
          score: 100, // Perfect score before any documents/transactions are evaluated
          bandColor: 'GREEN',
          deMinimisScore: 40,
          substanceScore: 25,
          auditReadinessScore: 15,
          relatedPartyScore: 10,
          classificationScore: 10,
          breakdownJson: {},
          explanationText: 'Initial baseline created during onboarding.',
          nqrAmount: 0,
          totalRevenue: 0,
          nqrPercentage: 0,
        }
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
    const existing = await this.prisma.user.findFirst({ where: { email } });
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
        from: this.config.get<string>('EMAIL_FROM', 'hello@gettaxsentry.com'),
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

  async listMembers(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { role: 'asc' },
    });
  }

  async revokeInvitation(orgId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, orgId, acceptedAt: null },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { expiresAt: new Date() },
    });
  }

  // ── Notification Preferences ─────────────────────────────────────────────────

  async getNotificationPrefs(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { notificationPrefsJson: true },
    });
    const defaults = {
      emailAlerts: true,
      breachAlerts: true,
      weeklyDigest: false,
      thresholdWarnings: true,
    };
    return { ...(org?.notificationPrefsJson as object ?? {}), ...defaults, ...(org?.notificationPrefsJson as object ?? {}) };
  }

  async updateNotificationPrefs(orgId: string, prefs: Record<string, boolean>) {
    const current = await this.getNotificationPrefs(orgId);
    const merged = { ...current, ...prefs };
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { notificationPrefsJson: merged },
    });
    return merged;
  }

  // ── Member management ────────────────────────────────────────────────────────

  async changeMemberRole(orgId: string, actorId: string, targetUserId: string, role: UserRole) {
    if (actorId === targetUserId) {
      throw new BadRequestException('You cannot change your own role');
    }
    if (role === UserRole.OWNER) {
      throw new BadRequestException('Use the transfer-ownership endpoint to assign the OWNER role');
    }

    const target = await this.prisma.user.findFirst({ where: { id: targetUserId, orgId } });
    if (!target) throw new NotFoundException('Member not found in this organization');

    const previous = target.role;
    await this.prisma.user.update({ where: { id: targetUserId }, data: { role } });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'MEMBER_ROLE_CHANGED',
        entity: 'User',
        entityId: targetUserId,
        beforeJson: { role: previous },
        afterJson: { role },
      },
    }).catch(() => {});

    return { message: 'Member role updated' };
  }

  async deactivateMember(orgId: string, actorId: string, targetUserId: string) {
    if (actorId === targetUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const target = await this.prisma.user.findFirst({ where: { id: targetUserId, orgId } });
    if (!target) throw new NotFoundException('Member not found in this organization');

    await this.prisma.user.update({ where: { id: targetUserId }, data: { isActive: false } });

    // Revoke all active sessions for the deactivated member
    await this.prisma.session.updateMany({
      where: { userId: targetUserId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'MEMBER_DEACTIVATED',
        entity: 'User',
        entityId: targetUserId,
        afterJson: { isActive: false },
      },
    }).catch(() => {});
  }

  async transferOwnership(orgId: string, actorId: string, newOwnerId: string) {
    if (actorId === newOwnerId) {
      throw new BadRequestException('You are already the owner');
    }

    const newOwner = await this.prisma.user.findFirst({ where: { id: newOwnerId, orgId } });
    if (!newOwner) throw new NotFoundException('Target user not found in this organization');

    // Transfer: new owner gets OWNER, current owner steps down to FINANCE
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: newOwnerId }, data: { role: UserRole.OWNER } }),
      this.prisma.user.update({ where: { id: actorId }, data: { role: UserRole.FINANCE } }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'OWNERSHIP_TRANSFERRED',
        entity: 'Organization',
        entityId: orgId,
        beforeJson: { ownerId: actorId },
        afterJson: { ownerId: newOwnerId },
      },
    }).catch(() => {});

    return { message: 'Ownership transferred successfully' };
  }

  async resendInvitation(orgId: string, actorId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, orgId, acceptedAt: null },
    });
    if (!invitation) throw new NotFoundException('Invitation not found or already accepted');

    const rawToken = generateOpaqueToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { tokenHash, expiresAt },
    });

    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
    const inviteLink = `${webUrl}/accept-invite?token=${rawToken}`;

    try {
      const Resend = (await import('resend')).Resend;
      const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
      await resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM', 'hello@gettaxsentry.com'),
        to: invitation.email,
        subject: `Reminder: You've been invited to join ${org?.name ?? 'TaxSentry'}`,
        html: `<p>This is a reminder that you have been invited to join <strong>${org?.name ?? 'an organization'}</strong> on TaxSentry as <strong>${invitation.role}</strong>.</p>
               <p><a href="${inviteLink}">Accept invitation</a></p>
               <p>This invitation expires in 7 days. If you did not expect this, you can safely ignore it.</p>`,
      });
    } catch (err: any) {
      throw new BadRequestException(`Invitation refreshed but email delivery failed: ${err.message}`);
    }

    return { message: `Invitation resent to ${invitation.email}` };
  }

  // ── Billing & Config ─────────────────────────────────────────────────────────

  async updateBilling(orgId: string, actorId: string, dto: { billingEmail?: string; billingAddress?: string }) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(dto.billingEmail !== undefined && { billingEmail: dto.billingEmail }),
        ...(dto.billingAddress !== undefined && { billingAddress: dto.billingAddress }),
      },
      select: { id: true, billingEmail: true, billingAddress: true },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'BILLING_UPDATED',
        entity: 'Organization',
        entityId: orgId,
        afterJson: dto,
      },
    }).catch(() => {});

    return org;
  }

  async updateAlertThresholds(orgId: string, actorId: string, thresholds: Record<string, unknown>) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { alertThresholdsJson: thresholds as any },
      select: { id: true, alertThresholdsJson: true },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'ALERT_THRESHOLDS_UPDATED',
        entity: 'Organization',
        entityId: orgId,
        afterJson: thresholds as any,
      },
    }).catch(() => {});

    return org;
  }

  async exportOrgData(orgId: string) {
    const [org, users, taxPeriods, txCount, substanceDocs] = await Promise.all([
      this.prisma.organization.findUniqueOrThrow({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          tradeLicenseNo: true,
          freeZone: true,
          taxRegistrationNo: true,
          primaryActivityCode: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          billingEmail: true,
          billingAddress: true,
          createdAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { orgId },
        select: { id: true, email: true, role: true, isActive: true, createdAt: true },
      }),
      this.prisma.taxPeriod.findMany({
        where: { orgId },
        orderBy: { startDate: 'desc' },
        select: { id: true, startDate: true, endDate: true, status: true, createdAt: true },
      }),
      this.prisma.revenueTransaction.count({ where: { orgId, isDeleted: false } }),
      this.prisma.substanceDocument.findMany({
        where: { orgId, isDeleted: false },
        select: { id: true, docType: true, status: true, expiresAt: true, createdAt: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      organization: org,
      users,
      taxPeriods,
      transactionCount: txCount,
      substanceDocuments: substanceDocs,
    };
  }

  async acceptDpa(orgId: string, actorId: string) {
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { dpaAcceptedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'DPA_ACCEPTED',
        entity: 'Organization',
        entityId: orgId,
        afterJson: { dpaAcceptedAt: new Date().toISOString() },
      },
    }).catch(() => {});

    return { message: 'Data Processing Agreement accepted', dpaAcceptedAt: new Date() };
  }

  async softDeleteOrganization(orgId: string, actorId: string, confirmation: string) {
    if (confirmation !== 'DELETE') {
      throw new BadRequestException('Confirmation string must be exactly "DELETE"');
    }

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    if (org.deletedAt) throw new BadRequestException('Organization is already deleted');

    const now = new Date();
    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        deletedAt: now,
        deletedBy: actorId,
        isActive: false,
        cancelledAt: org.cancelledAt ?? now,
      },
    });

    // Revoke all sessions for all org members
    const memberIds = await this.prisma.user.findMany({
      where: { orgId },
      select: { id: true },
    });
    await this.prisma.session.updateMany({
      where: { userId: { in: memberIds.map((m) => m.id) }, isRevoked: false },
      data: { isRevoked: true, revokedAt: now },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action: 'ORGANIZATION_DELETED',
        entity: 'Organization',
        entityId: orgId,
        afterJson: { deletedAt: now.toISOString(), deletedBy: actorId },
      },
    }).catch(() => {});
  }

  // ── Onboarding Status ────────────────────────────────────────────────────────

  async getOnboardingStatus(orgId: string) {
    const [org, taxPeriod, transactions, substance] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, tradeLicenseNo: true, taxRegistrationNo: true, freeZone: true, subscriptionStatus: true, subscriptionTier: true, createdAt: true },
      }),
      this.prisma.taxPeriod.findFirst({ where: { orgId } }),
      this.prisma.revenueTransaction.findFirst({ where: { orgId, isDeleted: false } }),
      this.prisma.substanceDocument.findFirst({ where: { orgId, isDeleted: false } }),
    ]);

    const steps = [
      {
        id: 'org_setup',
        label: 'Organisation Setup',
        description: 'Set your company name, free zone, and tax period',
        complete: !!(org?.tradeLicenseNo && taxPeriod),
      },
      {
        id: 'profile',
        label: 'Complete Profile',
        description: 'Add your TRN and primary activity',
        complete: !!(org?.taxRegistrationNo),
      },
      {
        id: 'revenue_data',
        label: 'Upload Revenue Data',
        description: 'Import your first revenue transactions',
        complete: !!transactions,
      },
      {
        id: 'classification',
        label: 'Review Classification',
        description: 'Verify QI/NQI classification results',
        complete: !!transactions,
      },
      {
        id: 'substance',
        label: 'Monitor Compliance',
        description: 'Upload substance documents and review risk score',
        complete: !!substance,
      },
      {
        id: 'subscription',
        label: 'Activate Subscription',
        description: 'Subscribe to continue after your trial',
        complete: org?.subscriptionStatus === 'ACTIVE',
      },
    ];

    const completedCount = steps.filter((s) => s.complete).length;
    return {
      steps,
      completedCount,
      totalSteps: steps.length,
      percentComplete: Math.round((completedCount / steps.length) * 100),
      isComplete: completedCount === steps.length,
    };
  }
}
