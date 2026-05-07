import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_BATCH = 500; // transactions per DB fetch
const ROWS_PER_PAGE = 30;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateClassificationPack(orgId: string, taxPeriodId: string): Promise<Buffer> {
    const [org, period] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.taxPeriod.findFirst({ where: { id: taxPeriodId, orgId } }),
    ]);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = { width: 595, height: 842 }; // A4

    // ── Cover page ──────────────────────────────────────────────────────────────
    let page = pdfDoc.addPage([width, height]);
    page.drawText('QFZP Status Protection', { x: 50, y: height - 80, size: 20, font: boldFont, color: rgb(0.1, 0.3, 0.7) });
    page.drawText('Revenue Classification Pack', { x: 50, y: height - 110, size: 16, font: boldFont });
    page.drawText(`Organization: ${org?.name ?? orgId}`, { x: 50, y: height - 160, size: 11, font });
    page.drawText(`Trade License: ${org?.tradeLicenseNo ?? 'N/A'}`, { x: 50, y: height - 180, size: 11, font });
    page.drawText(
      `Tax Period: ${period?.startDate.toISOString().slice(0, 10)} to ${period?.endDate.toISOString().slice(0, 10)}`,
      { x: 50, y: height - 200, size: 11, font },
    );
    page.drawText(`Generated: ${new Date().toISOString()} UTC`, { x: 50, y: height - 220, size: 11, font });
    page.drawText('Rule Version: CD100-2023-v1', { x: 50, y: height - 240, size: 11, font });
    page.drawText(
      'DISCLAIMER: This report is for informational use. It does not constitute tax advice.\nConsult a qualified UAE Corporate Tax advisor for material decisions.',
      { x: 50, y: height - 290, size: 9, font, color: rgb(0.5, 0.5, 0.5) },
    );

    // ── Stream transactions in batches to avoid OOM ─────────────────────────────
    let qi = 0, nqi = 0, excluded = 0, unclassified = 0, total = 0;
    let cursor: string | undefined;
    let txBuffer: Array<{
      date: Date;
      amountAed: { toString(): string };
      classification: string;
      counterparty: string;
      activityCatalog: { code: string; name: string } | null;
      overrides: Array<{ overriddenBy?: { email: string | null } | null; previousClassification: string; newClassification: string; reasonCode: string }>;
    }> = [];

    // Collect all for summary stats — still streamed in batches
    do {
      const batch = await this.prisma.revenueTransaction.findMany({
        where: { orgId, taxPeriodId, isDeleted: false },
        include: {
          activityCatalog: { select: { code: true, name: true } },
          overrides: {
            orderBy: { createdAt: 'asc' },
            include: { overriddenBy: { select: { email: true } } },
          },
        },
        orderBy: { date: 'asc' },
        take: PAGE_BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      for (const tx of batch) {
        if (tx.classification === 'QI') qi++;
        else if (tx.classification === 'NQI') nqi++;
        else if (tx.classification === 'EXCLUDED') excluded++;
        else unclassified++;
      }
      total += batch.length;
      txBuffer.push(...batch);
      cursor = batch.length === PAGE_BATCH ? (batch[batch.length - 1] as any).id : undefined;
    } while (cursor);

    // ── Summary section on cover page ───────────────────────────────────────────
    page.drawText('Summary', { x: 50, y: height - 340, size: 14, font: boldFont });
    page.drawText(`Total Transactions: ${total}`, { x: 50, y: height - 360, size: 11, font });
    page.drawText(`Qualifying Income (QI): ${qi}`, { x: 50, y: height - 380, size: 11, font, color: rgb(0.1, 0.6, 0.1) });
    page.drawText(`Non-Qualifying Income (NQI): ${nqi}`, { x: 50, y: height - 400, size: 11, font, color: rgb(0.8, 0.1, 0.1) });
    page.drawText(`Excluded: ${excluded}`, { x: 50, y: height - 420, size: 11, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(`Unclassified (REVIEW REQUIRED): ${unclassified}`, { x: 50, y: height - 440, size: 11, font });

    // ── Transaction detail pages ─────────────────────────────────────────────────
    let y = 0;
    for (let i = 0; i < txBuffer.length; i += ROWS_PER_PAGE) {
      const slice = txBuffer.slice(i, i + ROWS_PER_PAGE);
      page = pdfDoc.addPage([width, height]);
      y = height - 50;

      page.drawText(`Transactions (${i + 1}–${Math.min(i + ROWS_PER_PAGE, txBuffer.length)} of ${total})`, {
        x: 50, y, size: 13, font: boldFont,
      });
      y -= 25;

      for (const tx of slice) {
        const line = [
          tx.date.toISOString().slice(0, 10),
          `AED ${parseFloat(tx.amountAed.toString()).toFixed(0)}`,
          tx.classification,
          tx.counterparty.slice(0, 25),
          tx.activityCatalog?.code ?? 'N/A',
        ].join('  |  ');

        page.drawText(line, {
          x: 50, y, size: 8, font,
          color: tx.classification === 'NQI' ? rgb(0.7, 0, 0) : rgb(0, 0, 0),
        });
        y -= 15;

        if (tx.overrides.length > 0) {
          const ov = tx.overrides[tx.overrides.length - 1];
          page.drawText(
            `  ↳ Override by ${ov.overriddenBy?.email ?? '?'}: ${ov.previousClassification} → ${ov.newClassification} | ${ov.reasonCode}`,
            { x: 60, y, size: 7, font, color: rgb(0.3, 0.3, 0.8) },
          );
          y -= 12;
        }

        // Add a new page when space runs out — never silently truncate
        if (y < 60) {
          page = pdfDoc.addPage([width, height]);
          y = height - 50;
        }
      }
    }

    return Buffer.from(await pdfDoc.save());
  }

  async generateSubstancePack(orgId: string): Promise<Buffer> {
    const [org, docs] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.substanceDocument.findMany({
        where: { orgId, isDeleted: false },
        orderBy: { docType: 'asc' },
      }),
    ]);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = { width: 595, height: 842 };

    let page = pdfDoc.addPage([width, height]);
    page.drawText('QFZP Substance Document Pack', { x: 50, y: height - 80, size: 18, font: boldFont, color: rgb(0.1, 0.3, 0.7) });
    page.drawText(`Organization: ${org?.name ?? orgId}`, { x: 50, y: height - 130, size: 11, font });
    page.drawText(`Generated: ${new Date().toISOString()} UTC`, { x: 50, y: height - 150, size: 11, font });
    page.drawText(`Total documents on file: ${docs.length}`, { x: 50, y: height - 170, size: 11, font });

    let y = height - 220;

    for (const doc of docs) {
      // Add a new page when space runs out — never truncate
      if (y < 100) {
        page = pdfDoc.addPage([width, height]);
        y = height - 50;
      }

      const color = doc.status === 'ACTIVE' ? rgb(0.1, 0.6, 0.1) : rgb(0.8, 0.1, 0.1);
      page.drawText(`${doc.displayName}`, { x: 50, y, size: 10, font: boldFont });
      y -= 14;
      page.drawText(
        `  Status: ${doc.status}  |  File: ${doc.fileName}  |  Uploaded: ${doc.uploadedAt.toISOString().slice(0, 10)}`,
        { x: 50, y, size: 9, font, color },
      );
      if (doc.expiresAt) {
        y -= 12;
        page.drawText(`  Expires: ${doc.expiresAt.toISOString().slice(0, 10)}`, { x: 50, y, size: 9, font });
      }
      y -= 20;
    }

    return Buffer.from(await pdfDoc.save());
  }
}
