import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-log')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log entries for the current org' })
  async list(
    @CurrentUser('orgId') orgId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where: any = { orgId };
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
        select: {
          id: true,
          actorEmail: true,
          action: true,
          entity: true,
          entityId: true,
          timestamp: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      }
    };
  }

  @Get('activity-feed')
  @ApiOperation({ summary: 'Get unified activity timeline for the current org' })
  async activityFeed(
    @CurrentUser('orgId') orgId: string,
    @Query('limit') limit = 50,
  ) {
    const take = Math.min(Number(limit) || 50, 200);

    const ACTION_LABELS: Record<string, { label: string; icon: string; category: string }> = {
      USER_SIGNED_IN: { label: 'Signed in', icon: 'login', category: 'auth' },
      USER_SIGNED_OUT: { label: 'Signed out', icon: 'logout', category: 'auth' },
      SECURITY_NEW_DEVICE_LOGIN: { label: 'New device login detected', icon: 'shield', category: 'security' },
      USER_PROFILE_UPDATED: { label: 'Profile updated', icon: 'user', category: 'account' },
      ORG_SETUP_COMPLETED: { label: 'Organisation setup completed', icon: 'building', category: 'account' },
      ORG_UPDATED: { label: 'Organisation details updated', icon: 'building', category: 'account' },
      TRANSACTION_CREATED: { label: 'Transaction added', icon: 'plus', category: 'revenue' },
      CSV_IMPORT_COMPLETED: { label: 'CSV import completed', icon: 'upload', category: 'revenue' },
      CLASSIFICATION_OVERRIDE: { label: 'Classification overridden', icon: 'edit', category: 'compliance' },
      SUBSTANCE_DOCUMENT_UPLOADED: { label: 'Document uploaded', icon: 'file', category: 'substance' },
      SUBSTANCE_DOCUMENT_DELETED: { label: 'Document deleted', icon: 'trash', category: 'substance' },
      REPORT_GENERATED: { label: 'Report generated', icon: 'report', category: 'reports' },
      ALERT_ACKNOWLEDGED: { label: 'Alert acknowledged', icon: 'bell', category: 'alerts' },
      SUBSCRIPTION_ACTIVATED: { label: 'Subscription activated', icon: 'credit-card', category: 'billing' },
      SUBSCRIPTION_CANCELLED: { label: 'Subscription cancelled', icon: 'x-circle', category: 'billing' },
      SUBSCRIPTION_UPGRADED: { label: 'Plan upgraded', icon: 'arrow-up', category: 'billing' },
      TEAM_MEMBER_INVITED: { label: 'Team member invited', icon: 'user-plus', category: 'team' },
      SUPPORT_REQUEST_SUBMITTED: { label: 'Support request submitted', icon: 'help-circle', category: 'support' },
    };

    const [auditEntries, billingEvents] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { orgId },
        orderBy: { timestamp: 'desc' },
        take,
        select: {
          id: true,
          actorEmail: true,
          action: true,
          entity: true,
          entityId: true,
          afterJson: true,
          timestamp: true,
        },
      }),
      this.prisma.billingEvent.findMany({
        where: { orgId },
        orderBy: { processedAt: 'desc' },
        take: 20,
        select: { id: true, eventType: true, processedAt: true },
      }),
    ]);

    const auditItems = auditEntries.map((e) => {
      const meta = ACTION_LABELS[e.action] ?? { label: e.action, icon: 'activity', category: 'system' };
      return {
        id: e.id,
        type: 'audit' as const,
        category: meta.category,
        icon: meta.icon,
        label: meta.label,
        actor: e.actorEmail ?? 'System',
        entityId: e.entityId,
        detail: e.afterJson,
        timestamp: e.timestamp,
      };
    });

    const BILLING_EVENT_LABELS: Record<string, { label: string; icon: string }> = {
      'subscription.active': { label: 'Subscription activated', icon: 'credit-card' },
      'subscription.cancelled': { label: 'Subscription cancelled', icon: 'x-circle' },
      'subscription.past_due': { label: 'Payment past due', icon: 'alert-triangle' },
      'subscription.renewed': { label: 'Subscription renewed', icon: 'refresh-cw' },
      'payment.succeeded': { label: 'Payment succeeded', icon: 'check-circle' },
      'payment.failed': { label: 'Payment failed', icon: 'x-circle' },
    };

    const billingItems = billingEvents.map((e) => {
      const meta = BILLING_EVENT_LABELS[e.eventType] ?? { label: e.eventType, icon: 'credit-card' };
      return {
        id: `billing-${e.id}`,
        type: 'billing' as const,
        category: 'billing',
        icon: meta.icon,
        label: meta.label,
        actor: 'Dodo Payments',
        entityId: e.id,
        detail: null,
        timestamp: e.processedAt,
      };
    });

    const all = [...auditItems, ...billingItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, take);

    return { data: all };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit log to CSV' })
  async export(
    @CurrentUser('orgId') orgId: string,
    @Res() reply: any,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: any = { orgId };
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const entries = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        entity: true,
        entityId: true,
        timestamp: true,
      },
    });

    const { stringify } = require('csv-stringify/sync');
    const csv = stringify(entries, { header: true });
    
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="audit-log-export.csv"`)
      .send(csv);
  }
}
