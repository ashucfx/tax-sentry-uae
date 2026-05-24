import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async submitDemoRequest(
    dto: CreateLeadDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ id: string }> {
    const emailLower = dto.email.toLowerCase();

    // Idempotency / Deduplication: check if lead exists within the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existing = await this.prisma.lead.findFirst({
      where: {
        email: emailLower,
        createdAt: { gte: twelveHoursAgo },
      },
    });

    if (existing) {
      this.logger.warn(`Duplicate demo request for ${dto.email} — suppressed`);
      return { id: existing.id };
    }

    // Since email is unique in the schema, we use upsert to avoid duplicate errors
    const record = await this.prisma.lead.upsert({
      where: { email: emailLower },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        jobTitle: dto.jobTitle,
        phone: dto.phone,
        freeZone: dto.freeZone,
        companySize: dto.companySize,
        revenueRange: dto.revenueRange,
        demoSlot: dto.demoSlot,
        message: dto.message,
        source: 'DEMO_REQUEST',
        ipAddress: meta.ipAddress,
      },
      create: {
        email: emailLower,
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        jobTitle: dto.jobTitle,
        phone: dto.phone,
        freeZone: dto.freeZone,
        companySize: dto.companySize,
        revenueRange: dto.revenueRange,
        demoSlot: dto.demoSlot,
        message: dto.message,
        source: 'DEMO_REQUEST',
        ipAddress: meta.ipAddress,
      },
    });

    this.logger.log(`Demo request stored in DB: id=${record.id} email=${dto.email} company=${dto.company}`);

    // Fire-and-forget: email delivery must not block the 200 response
    void this.sendEmails(record).catch((err) =>
      this.logger.error(`Email delivery failed for lead ${record.id}: ${(err as Error).message}`),
    );

    return { id: record.id };
  }

  private async sendEmails(lead: any): Promise<void> {
    const apiKey = this.cfg.get<string>('RESEND_API_KEY');
    if (!apiKey || apiKey === 're_placeholder') {
      this.logger.warn(`[LEADS] Resend API key not configured — skipping email delivery for ${lead.email}`);
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const from = this.cfg.get<string>('EMAIL_FROM', 'alerts@taxsentry.ae');
    const notifyTo = this.cfg.get<string>('LEAD_NOTIFY_EMAIL', 'hello@taxsentry.com');

    const humanDate = lead.createdAt.toLocaleString('en-AE', { timeZone: 'Asia/Dubai' });

    // 1. Internal notification to the TaxSentry team
    await resend.emails.send({
      from,
      to: notifyTo,
      subject: `🚀 New demo request — ${lead.firstName} ${lead.lastName ?? ''} @ ${lead.company}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#0a1628;color:#e2e8f0;border-radius:12px">
          <h2 style="margin:0 0 24px;color:#60a5fa;font-size:22px">New Demo Request Received</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${[
              ['Name', `${lead.firstName} ${lead.lastName ?? ''}`.trim()],
              ['Email', lead.email],
              ['Company', lead.company],
              ['Job Title', lead.jobTitle ?? '—'],
              ['Phone', lead.phone ?? '—'],
              ['Free Zone', lead.freeZone ?? '—'],
              ['Company Size', lead.companySize ?? '—'],
              ['Revenue Range', lead.revenueRange ?? '—'],
              ['Demo Slot', lead.demoSlot ?? '—'],
              ['Submitted', humanDate],
              ['IP Address', lead.ipAddress ?? '—'],
            ]
              .map(
                ([label, value]) => `
              <tr>
                <td style="padding:8px 12px;background:#0f1e38;border-radius:4px;color:#94a3b8;font-weight:600;width:140px">${label}</td>
                <td style="padding:8px 12px;color:#e2e8f0">${value}</td>
              </tr>`,
              )
              .join('')}
          </table>
          ${
            lead.message
              ? `<div style="margin-top:20px;padding:16px;background:#0f1e38;border-radius:8px;border-left:3px solid #3b82f6">
              <div style="color:#94a3b8;font-size:12px;font-weight:600;margin-bottom:8px">MESSAGE FROM ${(lead.firstName ?? '').toUpperCase()}</div>
              <div style="color:#cbd5e1;font-size:14px;line-height:1.6">${lead.message.replace(/</g, '&lt;')}</div>
            </div>`
              : ''
          }
          <div style="margin-top:28px;padding:12px 16px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.25);border-radius:8px;font-size:13px;color:#34d399">
            ✓ Reply within 2 hours as promised on the website
          </div>
        </div>
      `,
    });

    // 2. Auto-confirmation to the prospect
    await resend.emails.send({
      from,
      to: lead.email,
      subject: `Your TaxSentry demo request has been received`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="font-size:26px;font-weight:900;letter-spacing:-0.03em">Tax<span style="color:#2563eb">Sentry</span></div>
          </div>
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px">Hi ${lead.firstName},</h2>
          <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7">
            Thank you for requesting a demo. We've received your details and our UAE compliance team will be in touch within <strong>2 hours</strong> with a calendar invite.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:24px 0">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">What to expect</div>
            ${[
              '30-minute session tailored to your entity and free zone',
              'Live walkthrough of your risk exposure using your company profile',
              'Direct Q&A with a UAE corporate tax compliance specialist',
              'No slides. No generic demos. Built around your data.',
            ]
              .map(
                (item) =>
                  `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
                <span style="color:#10b981;margin-top:2px">✓</span>
                <span style="color:#334155;font-size:14px">${item}</span>
              </div>`,
              )
              .join('')}
          </div>
          <p style="margin:0 0 8px;color:#64748b;font-size:13px">
            If you have any urgent questions, email us directly at 
            <a href="mailto:hello@taxsentry.com" style="color:#2563eb">hello@taxsentry.com</a>
          </p>
          <p style="margin:0;color:#94a3b8;font-size:12px">
            TaxSentry — A product of Ripple Nexus. Dubai International Financial Centre.
          </p>
        </div>
      `,
    });

    this.logger.log(`[LEADS] Confirmation emails sent for ${lead.email}`);
  }
}
