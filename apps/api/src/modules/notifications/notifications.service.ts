import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = Record<string, any>;

const NOTIFICATION_LOGS_PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all unresolved, non-snoozed Alert records for the org,
   * ordered by triggeredAt desc, capped at 50 — used for the in-app
   * notification bell.
   */
  async getInAppAlerts(orgId: string) {
    return this.prisma.alert.findMany({
      where: {
        orgId,
        isResolved: false,
        OR: [
          { snoozedUntil: null },
          { snoozedUntil: { lt: new Date() } },
        ],
      },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
      select: {
        id: true,
        severity: true,
        code: true,
        title: true,
        message: true,
        triggeredAt: true,
        acknowledgedAt: true,
        acknowledgedBy: true,
      },
    });
  }

  /**
   * Acknowledges an alert: stamps acknowledgedAt + acknowledgedBy.
   * Verifies org ownership before updating.
   */
  async acknowledgeAlert(orgId: string, alertId: string, userId: string): Promise<void> {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, orgId },
      select: { id: true },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });
  }

  /**
   * Returns NotificationLog records for the org, newest first,
   * paginated at 20 per page.
   */
  async getNotificationLogs(orgId: string, page = 1) {
    const skip = (Math.max(1, page) - 1) * NOTIFICATION_LOGS_PAGE_SIZE;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationLog.findMany({
        where: { orgId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: NOTIFICATION_LOGS_PAGE_SIZE,
        select: {
          id: true,
          type: true,
          recipient: true,
          subject: true,
          sentAt: true,
          status: true,
          errorText: true,
          metadata: true,
        },
      }),
      this.prisma.notificationLog.count({ where: { orgId } }),
    ]);

    return {
      items,
      total,
      page: Math.max(1, page),
      pageSize: NOTIFICATION_LOGS_PAGE_SIZE,
      totalPages: Math.ceil(total / NOTIFICATION_LOGS_PAGE_SIZE),
    };
  }

  /**
   * Creates a NotificationLog record. Intended for internal use by other
   * services (e.g. EmailService, AlertsEngine) to record delivery outcomes.
   */
  async logNotification(
    orgId: string,
    type: string,
    recipient: string,
    subject: string,
    status: string,
    errorText?: string,
    metadata?: JsonValue,
  ) {
    return this.prisma.notificationLog.create({
      data: {
        orgId,
        type,
        recipient,
        subject,
        status,
        errorText: errorText ?? null,
        metadata: metadata ? (metadata as Prisma.InputJsonObject) : Prisma.JsonNull,
      },
    });
  }
}
