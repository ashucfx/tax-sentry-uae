/**
 * Alerts Engine
 * Severity: RED > AMBER > INFO
 * De-duplication: same alert code + org + day = collapsed to one
 * Cap: 1 email/day/org except RED (which always sends)
 */

import { Injectable, Logger } from '@nestjs/common';
import { AlertSeverity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeMinimisBreakdown } from '../deminimis/deminimis.engine';
import { EmailService } from './email.service';

export interface AlertTriggerResult {
  fired: boolean;
  alertId?: string;
  deduplicated: boolean;
  severity?: AlertSeverity;
}

const ALERT_CODES = {
  DE_MINIMIS_60: 'DE_MINIMIS_60_PCT',
  DE_MINIMIS_80: 'DE_MINIMIS_80_PCT',
  DE_MINIMIS_90: 'DE_MINIMIS_90_PCT',
  DE_MINIMIS_95: 'DE_MINIMIS_95_PCT',
  DE_MINIMIS_BREACH: 'DE_MINIMIS_BREACH',
  SUBSTANCE_DOC_EXPIRING_30: 'SUBSTANCE_DOC_EXPIRING_30D',
  SUBSTANCE_DOC_EXPIRING_60: 'SUBSTANCE_DOC_EXPIRING_60D',
  SUBSTANCE_DOC_EXPIRING_90: 'SUBSTANCE_DOC_EXPIRING_90D',
  SUBSTANCE_DOC_EXPIRED: 'SUBSTANCE_DOC_EXPIRED',
  SUBSTANCE_DOC_MISSING: 'SUBSTANCE_DOC_MISSING',
  UNCLASSIFIED_TRANSACTIONS: 'UNCLASSIFIED_TRANSACTIONS',
  RELATED_PARTY_NO_TP: 'RELATED_PARTY_NO_TP',
  AUDIT_FS_MISSING: 'AUDIT_FS_MISSING',
  NQI_LARGE_TRANSACTION: 'NQI_LARGE_TRANSACTION',
  ZOHO_SYNC_STALE: 'INTEGRATION_SYNC_STALE',
} as const;

@Injectable()
export class AlertsEngine {
  private readonly logger = new Logger(AlertsEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async evaluateDeMinimisAlerts(
    orgId: string,
    breakdown: DeMinimisBreakdown,
  ): Promise<AlertTriggerResult[]> {
    const results: AlertTriggerResult[] = [];
    const threshold = breakdown.alertThresholdPct;

    if (breakdown.isBreached) {
      results.push(
        await this.fire(orgId, AlertSeverity.RED, ALERT_CODES.DE_MINIMIS_BREACH, {
          title: 'QFZP STATUS BREACHED — Immediate Action Required',
          message:
            `Your Non-Qualifying Income has exceeded the de-minimis threshold. ` +
            `NQI: AED ${this.fmt(breakdown.nqrAmount.toNumber())} ` +
            `(${breakdown.nqrPercentage.toFixed(2)}% of total revenue). ` +
            `Your entity has lost QFZP status. Contact your tax advisor immediately.`,
          payload: { nqrAmount: breakdown.nqrAmount.toString(), pct: breakdown.nqrPercentage.toString() },
        }),
      );
      return results; // BREACH fires, nothing else needed
    }

    if (threshold >= 95) {
      results.push(
        await this.fire(orgId, AlertSeverity.RED, ALERT_CODES.DE_MINIMIS_95, {
          title: 'QFZP Breach Imminent — 95% of Threshold Consumed',
          message:
            `Your NQI is at ${threshold}% of the de-minimis limit. ` +
            `Projected to breach before period end. Review and reclassify transactions immediately.`,
          payload: { threshold },
        }),
      );
    } else if (threshold >= 90) {
      results.push(
        await this.fire(orgId, AlertSeverity.AMBER, ALERT_CODES.DE_MINIMIS_90, {
          title: 'De-Minimis Warning — 90% of Threshold Consumed',
          message: `NQI at ${threshold}% of the de-minimis limit. Approaching breach zone.`,
          payload: { threshold },
        }),
      );
    } else if (threshold >= 80) {
      results.push(
        await this.fire(orgId, AlertSeverity.AMBER, ALERT_CODES.DE_MINIMIS_80, {
          title: 'De-Minimis Alert — 80% of Threshold Consumed',
          message: `NQI at ${threshold}% of the de-minimis limit. Monitor closely.`,
          payload: { threshold },
        }),
      );
    } else if (threshold >= 60) {
      results.push(
        await this.fire(orgId, AlertSeverity.INFO, ALERT_CODES.DE_MINIMIS_60, {
          title: 'De-Minimis Notice — 60% of Threshold Consumed',
          message: `NQI at ${threshold}% of the de-minimis limit. No immediate action needed.`,
          payload: { threshold },
        }),
      );
    }

    return results;
  }

  async evaluateSubstanceAlerts(orgId: string): Promise<AlertTriggerResult[]> {
    const results: AlertTriggerResult[] = [];
    const now = new Date();

    const docs = await this.prisma.substanceDocument.findMany({
      where: { orgId, isDeleted: false },
      select: { id: true, docType: true, displayName: true, expiresAt: true, status: true },
    });

    for (const doc of docs) {
      if (!doc.expiresAt) continue;

      const daysUntilExpiry = Math.floor(
        (doc.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (doc.status === 'EXPIRED' || daysUntilExpiry < 0) {
        results.push(
          await this.fire(orgId, AlertSeverity.RED, ALERT_CODES.SUBSTANCE_DOC_EXPIRED, {
            title: `Substance Document Expired: ${doc.displayName}`,
            message: `${doc.displayName} has expired. Upload the renewed document immediately.`,
            payload: { docId: doc.id, docType: doc.docType },
          }),
        );
      } else if (daysUntilExpiry <= 30) {
        results.push(
          await this.fire(orgId, AlertSeverity.AMBER, ALERT_CODES.SUBSTANCE_DOC_EXPIRING_30, {
            title: `Document Expiring in ${daysUntilExpiry} Days: ${doc.displayName}`,
            message: `${doc.displayName} expires on ${doc.expiresAt.toISOString().slice(0, 10)}.`,
            payload: { docId: doc.id, docType: doc.docType, daysUntilExpiry },
          }),
        );
      } else if (daysUntilExpiry <= 60) {
        results.push(
          await this.fire(orgId, AlertSeverity.INFO, ALERT_CODES.SUBSTANCE_DOC_EXPIRING_60, {
            title: `Document Expiring in ${daysUntilExpiry} Days: ${doc.displayName}`,
            message: `${doc.displayName} expires in ${daysUntilExpiry} days.`,
            payload: { docId: doc.id, docType: doc.docType, daysUntilExpiry },
          }),
        );
      }
    }

    return results;
  }

  async evaluateLargeNqiAlert(
    orgId: string,
    transactionId: string,
    amountAed: number,
  ): Promise<AlertTriggerResult> {
    if (amountAed > 500_000) {
      return this.fire(orgId, AlertSeverity.AMBER, ALERT_CODES.NQI_LARGE_TRANSACTION, {
        title: `Large NQI Transaction Requires Review: AED ${this.fmt(amountAed)}`,
        message:
          `A Non-Qualifying Income transaction of AED ${this.fmt(amountAed)} ` +
          `requires mandatory reviewer acknowledgment.`,
        payload: { transactionId, amountAed },
      });
    }
    return { fired: false, deduplicated: false };
  }

  // ─── CORE FIRE METHOD — De-duplication + Persistence ─────────────────────

  private async fire(
    orgId: string,
    severity: AlertSeverity,
    code: string,
    content: { title: string; message: string; payload?: Record<string, unknown> },
  ): Promise<AlertTriggerResult> {
    // De-duplication: same code + org + today = suppress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dedupKey = `${orgId}:${code}:${today.toISOString().slice(0, 10)}`;

    const existing = await this.prisma.alert.findFirst({
      where: {
        orgId,
        code,
        triggeredAt: { gte: today, lt: tomorrow },
        isResolved: false,
      },
    });

    if (existing) {
      return { fired: false, deduplicated: true, alertId: existing.id, severity };
    }

    const alert = await this.prisma.alert.create({
      data: {
        orgId,
        severity,
        code,
        title: content.title,
        message: content.message,
        payloadJson: (content.payload ?? {}) as Prisma.InputJsonObject,
        dedupKey,
      },
    });

    this.logger.log(`[${severity}] Alert fired: ${code} for org ${orgId}`);

    // Fire-and-forget email — don't let email failure block the alert record
    this.email
      .sendAlertEmail({
        alertId: alert.id,
        orgId,
        severity,
        code,
        title: content.title,
        message: content.message,
      })
      .catch((err) => this.logger.error(`Email dispatch error: ${(err as Error).message}`));

    return { fired: true, alertId: alert.id, deduplicated: false, severity };
  }

  async acknowledgeAlert(
    alertId: string,
    orgId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.alert.updateMany({
      where: { id: alertId, orgId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });
  }

  async snoozeAlert(
    alertId: string,
    orgId: string,
    userId: string,
    reason: string,
    snoozeDays = 7,
  ): Promise<void> {
    const alert = await this.prisma.alert.findFirst({ where: { id: alertId, orgId } });

    if (alert?.severity === AlertSeverity.RED) {
      throw new Error('RED alerts cannot be snoozed');
    }

    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + snoozeDays);

    await this.prisma.alert.updateMany({
      where: { id: alertId, orgId },
      data: { snoozedUntil, snoozeReason: reason, snoozedBy: userId },
    });

    // Snooze reason goes into audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'SNOOZE_ALERT',
        entity: 'Alert',
        entityId: alertId,
        afterJson: { reason, snoozeDays },
      },
    });
  }

  private fmt(amount: number): string {
    return new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(amount);
  }
}
