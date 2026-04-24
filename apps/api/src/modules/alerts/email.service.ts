import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AlertSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface AlertEmailPayload {
  alertId: string;
  orgId: string;
  severity: AlertSeverity;
  code: string;
  title: string;
  message: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.resend = new Resend(this.config.getOrThrow('RESEND_API_KEY'));
    this.from = this.config.get('EMAIL_FROM', 'alerts@qfzp.ae');
    this.webUrl = this.config.get('WEB_URL', 'https://qfzp.vercel.app');
  }

  /**
   * Send an alert email to all OWNER + FINANCE users in the org.
   * Deduplication: RED always sends. AMBER/INFO capped at 1 per org per day.
   * Returns true if email was dispatched.
   */
  async sendAlertEmail(payload: AlertEmailPayload): Promise<boolean> {
    // Enforce daily cap for non-RED alerts
    if (payload.severity !== AlertSeverity.RED) {
      const alreadySentToday = await this.orgAlreadyEmailedToday(payload.orgId);
      if (alreadySentToday) {
        this.logger.debug(`Email cap hit for org ${payload.orgId} — skipping ${payload.code}`);
        return false;
      }
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        orgId: payload.orgId,
        isActive: true,
        role: { in: ['OWNER', 'FINANCE'] },
      },
      select: { email: true },
    });

    if (recipients.length === 0) {
      this.logger.warn(`No OWNER/FINANCE users found for org ${payload.orgId}`);
      return false;
    }

    const to = recipients.map((u) => u.email);
    const html = this.renderHtml(payload);
    const subject = this.buildSubject(payload.severity, payload.title);

    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });

      await this.prisma.alert.update({
        where: { id: payload.alertId },
        data: { emailSentAt: new Date() },
      });

      this.logger.log(`Alert email sent [${payload.severity}] ${payload.code} → ${to.join(', ')}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send alert email: ${(err as Error).message}`);
      return false;
    }
  }

  private async orgAlreadyEmailedToday(orgId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.prisma.alert.count({
      where: {
        orgId,
        emailSentAt: { gte: today, lt: tomorrow },
      },
    });

    return count > 0;
  }

  private buildSubject(severity: AlertSeverity, title: string): string {
    const prefix =
      severity === AlertSeverity.RED
        ? '[URGENT] QFZP Alert'
        : severity === AlertSeverity.AMBER
          ? '[Warning] QFZP Alert'
          : '[Notice] QFZP';
    return `${prefix}: ${title}`;
  }

  private renderHtml(payload: AlertEmailPayload): string {
    const borderColor =
      payload.severity === AlertSeverity.RED
        ? '#dc2626'
        : payload.severity === AlertSeverity.AMBER
          ? '#d97706'
          : '#2563eb';

    const badgeColor = borderColor;

    const badge =
      payload.severity === AlertSeverity.RED
        ? 'CRITICAL'
        : payload.severity === AlertSeverity.AMBER
          ? 'WARNING'
          : 'INFO';

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border-top:4px solid ${borderColor};box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 0">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.1em;color:${badgeColor}">${badge}</p>
            <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3">${escapeHtml(payload.title)}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:20px 40px">
            <p style="margin:0;font-size:15px;color:#334155;line-height:1.6">${escapeHtml(payload.message)}</p>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 32px">
            <a href="${this.webUrl}/dashboard"
               style="display:inline-block;background:${borderColor};color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 24px;border-radius:6px">
              View Dashboard
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              Alert code: ${payload.code} · QFZP Status Protection<br>
              You receive this because your account has OWNER or FINANCE role.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
