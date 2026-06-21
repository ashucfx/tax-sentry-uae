import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { DeMinimisEngine } from '../deminimis/deminimis.engine';

const PAGE_BATCH = 500; // transactions per DB fetch
const ROWS_PER_PAGE = 30;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deMinimisEngine: DeMinimisEngine,
  ) {}

  // ── Existing: Classification Pack PDF ───────────────────────────────────────
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

  // ── NEW: FTA Return JSON ──────────────────────────────────────────────────────
  async generateFtaReturn(orgId: string, userId: string, taxPeriodId: string): Promise<object> {
    this.logger.log(`Generating FTA Return for org=${orgId} period=${taxPeriodId}`);

    const [org, period] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.taxPeriod.findFirst({ where: { id: taxPeriodId, orgId } }),
    ]);

    if (!org) throw new NotFoundException('Organization not found');
    if (!period) throw new NotFoundException('Tax period not found or does not belong to this org');

    // Aggregate revenue by classification
    const aggregates = await this.prisma.revenueTransaction.groupBy({
      by: ['classification'],
      where: { orgId, taxPeriodId, isDeleted: false },
      _sum: { amountAed: true },
    });

    let totalRevenue = 0;
    let qualifyingIncome = 0;
    let nonQualifyingIncome = 0;
    let excludedIncome = 0;

    for (const row of aggregates) {
      const amount = parseFloat(row._sum.amountAed?.toString() ?? '0');
      switch (row.classification) {
        case 'QI':
          qualifyingIncome += amount;
          totalRevenue += amount;
          break;
        case 'NQI':
          nonQualifyingIncome += amount;
          totalRevenue += amount;
          break;
        case 'EXCLUDED':
          excludedIncome += amount;
          break;
      }
    }

    // De-minimis test values
    const ABS_THRESHOLD = 5_000_000;
    const REL_THRESHOLD = 5;
    const nqiPercentage = totalRevenue > 0 ? (nonQualifyingIncome / totalRevenue) * 100 : 0;
    const deMinimisAbsPassed = nonQualifyingIncome <= ABS_THRESHOLD;
    const deMinimisRelPassed = nqiPercentage <= REL_THRESHOLD;
    const deMinimisOverallPassed = deMinimisAbsPassed && deMinimisRelPassed;

    // Risk snapshot
    const riskSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Substance documents
    const substanceDocs = await this.prisma.substanceDocument.findMany({
      where: { orgId, isDeleted: false },
      select: {
        docType: true,
        displayName: true,
        status: true,
        fileName: true,
        uploadedAt: true,
        expiresAt: true,
      },
      orderBy: { docType: 'asc' },
    });

    const generatedAt = new Date().toISOString();

    const ftaReturn = {
      reportVersion: '1.0',
      reportType: 'QFZP_ANNUAL_RETURN',
      generatedAt,
      organization: {
        name: org.name,
        tradeLicenseNo: org.tradeLicenseNo,
        freeZone: org.freeZone,
        taxRegistrationNo: org.taxRegistrationNo ?? null,
      },
      taxPeriod: {
        id: period.id,
        startDate: period.startDate.toISOString().slice(0, 10),
        endDate: period.endDate.toISOString().slice(0, 10),
        status: period.status,
      },
      revenue: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        qualifyingIncome: parseFloat(qualifyingIncome.toFixed(2)),
        nonQualifyingIncome: parseFloat(nonQualifyingIncome.toFixed(2)),
        excludedIncome: parseFloat(excludedIncome.toFixed(2)),
        deMinimisTest: {
          absThreshold: ABS_THRESHOLD,
          relThreshold: REL_THRESHOLD,
          nqiAmount: parseFloat(nonQualifyingIncome.toFixed(2)),
          nqiPercentage: parseFloat(nqiPercentage.toFixed(4)),
          absPassed: deMinimisAbsPassed,
          relPassed: deMinimisRelPassed,
          passed: deMinimisOverallPassed,
        },
      },
      deMinimisCompliance: {
        passed: deMinimisOverallPassed,
        details: {
          absoluteTestPassed: deMinimisAbsPassed,
          relativeTestPassed: deMinimisRelPassed,
          nqiVsAbsThreshold: `AED ${nonQualifyingIncome.toFixed(2)} vs AED ${ABS_THRESHOLD.toLocaleString('en-US')}`,
          nqiVsRelThreshold: `${nqiPercentage.toFixed(2)}% vs ${REL_THRESHOLD}%`,
        },
      },
      substanceDocuments: substanceDocs.map((doc) => ({
        docType: doc.docType,
        displayName: doc.displayName,
        status: doc.status,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt.toISOString().slice(0, 10),
        expiresAt: doc.expiresAt ? doc.expiresAt.toISOString().slice(0, 10) : null,
      })),
      riskScore: riskSnapshot
        ? {
            score: riskSnapshot.score,
            band: riskSnapshot.bandColor,
            snapshotDate: riskSnapshot.createdAt.toISOString().slice(0, 10),
          }
        : { score: null, band: 'UNKNOWN', snapshotDate: null },
      certificationStatement:
        'I certify that the information provided in this return is true, correct and complete to the best of my knowledge and belief.',
    };

    // Persist record
    await this.prisma.reportRecord.create({
      data: {
        orgId,
        taxPeriodId,
        type: 'FTA_RETURN',
        generatedByUserId: userId,
        status: 'COMPLETED',
        parametersJson: { taxPeriodId },
      },
    });

    this.logger.log(`FTA Return generated for org=${orgId} period=${taxPeriodId}`);
    return ftaReturn;
  }

  // ── NEW: Executive Summary PDF ────────────────────────────────────────────────
  async generateExecutiveSummary(orgId: string, userId: string, taxPeriodId: string): Promise<Buffer> {
    this.logger.log(`Generating Executive Summary for org=${orgId} period=${taxPeriodId}`);

    const [org, period] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.taxPeriod.findFirst({ where: { id: taxPeriodId, orgId } }),
    ]);

    if (!org) throw new NotFoundException('Organization not found');
    if (!period) throw new NotFoundException('Tax period not found or does not belong to this org');

    // Revenue aggregates
    const aggregates = await this.prisma.revenueTransaction.groupBy({
      by: ['classification'],
      where: { orgId, taxPeriodId, isDeleted: false },
      _sum: { amountAed: true },
      _count: { id: true },
    });

    let totalRevenue = 0;
    let qualifyingIncome = 0;
    let nonQualifyingIncome = 0;
    let excludedIncome = 0;
    let txCount = 0;

    for (const row of aggregates) {
      const amount = parseFloat(row._sum.amountAed?.toString() ?? '0');
      txCount += row._count.id;
      switch (row.classification) {
        case 'QI': qualifyingIncome += amount; totalRevenue += amount; break;
        case 'NQI': nonQualifyingIncome += amount; totalRevenue += amount; break;
        case 'EXCLUDED': excludedIncome += amount; break;
      }
    }

    // De-minimis via engine for full breakdown
    const dm = await this.deMinimisEngine.calculate({
      orgId,
      taxPeriodId: period.id,
      periodStart: period.startDate,
      periodEnd: period.endDate,
    });

    const riskSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    const substanceDocs = await this.prisma.substanceDocument.findMany({
      where: { orgId, isDeleted: false },
      orderBy: { docType: 'asc' },
    });

    const activeDocCount = substanceDocs.filter((d) => d.status === 'ACTIVE').length;
    const expiredDocCount = substanceDocs.filter((d) => d.status !== 'ACTIVE').length;

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const W = 595;
    const H = 842;

    // ── PAGE 1: Cover + Executive Summary ──────────────────────────────────────
    const page1 = pdfDoc.addPage([W, H]);

    // Header bar
    page1.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: rgb(0.05, 0.25, 0.6) });
    page1.drawText('TaxSentry UAE — Executive Summary', {
      x: 40, y: H - 42, size: 18, font: boldFont, color: rgb(1, 1, 1),
    });
    page1.drawText('QFZP Compliance Report', {
      x: 40, y: H - 60, size: 10, font, color: rgb(0.8, 0.9, 1),
    });

    // Org details block
    let y = H - 100;
    page1.drawText(org.name, { x: 40, y, size: 13, font: boldFont });
    y -= 16;
    page1.drawText(`Trade License: ${org.tradeLicenseNo}  |  Free Zone: ${org.freeZone}`, { x: 40, y, size: 10, font });
    y -= 14;
    page1.drawText(`TRN: ${org.taxRegistrationNo ?? 'Not Registered'}`, { x: 40, y, size: 10, font });
    y -= 14;
    page1.drawText(
      `Tax Period: ${period.startDate.toISOString().slice(0, 10)} to ${period.endDate.toISOString().slice(0, 10)}`,
      { x: 40, y, size: 10, font },
    );
    y -= 14;
    page1.drawText(`Generated: ${new Date().toISOString().slice(0, 10)} UTC`, { x: 40, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

    // Divider
    y -= 20;
    page1.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    // Revenue section
    page1.drawText('Revenue Breakdown', { x: 40, y, size: 13, font: boldFont });
    y -= 20;
    const fmt = (n: number) => `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    page1.drawText(`Total Revenue (QI + NQI):  ${fmt(totalRevenue)}`, { x: 40, y, size: 11, font });
    y -= 16;
    page1.drawText(`Qualifying Income (QI):    ${fmt(qualifyingIncome)}`, { x: 40, y, size: 11, font, color: rgb(0.1, 0.55, 0.1) });
    y -= 16;
    page1.drawText(`Non-Qualifying Income (NQI): ${fmt(nonQualifyingIncome)}`, { x: 40, y, size: 11, font, color: rgb(0.75, 0.1, 0.1) });
    y -= 16;
    page1.drawText(`Excluded Income:           ${fmt(excludedIncome)}`, { x: 40, y, size: 11, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 16;
    page1.drawText(`Total Transactions:        ${txCount}`, { x: 40, y, size: 11, font });

    y -= 28;
    page1.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    // De-minimis section
    const dmPassed = !dm.isBreached;
    const dmColor = dmPassed ? rgb(0.1, 0.55, 0.1) : rgb(0.75, 0.1, 0.1);
    page1.drawText('De-Minimis Compliance', { x: 40, y, size: 13, font: boldFont });
    y -= 20;
    page1.drawText(`Status:          ${dmPassed ? 'COMPLIANT' : 'BREACHED'}`, { x: 40, y, size: 11, font: boldFont, color: dmColor });
    y -= 16;
    page1.drawText(`NQI Amount:      ${fmt(dm.nqrAmount.toNumber())}  (Threshold: AED 5,000,000)`, { x: 40, y, size: 11, font });
    y -= 16;
    page1.drawText(
      `NQI Percentage:  ${dm.nqrPercentage.toFixed(2)}%  (Threshold: 5%)`,
      { x: 40, y, size: 11, font },
    );
    y -= 16;
    page1.drawText(`Breach Type:     ${dm.breachType}`, { x: 40, y, size: 11, font });
    y -= 16;
    page1.drawText(`Margin to Breach AED: ${fmt(dm.marginToBreachAed.toNumber())}`, { x: 40, y, size: 11, font });

    y -= 28;
    page1.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    // Risk section
    const riskBand = riskSnapshot?.bandColor ?? 'UNKNOWN';
    const riskColor =
      riskBand === 'GREEN' ? rgb(0.1, 0.55, 0.1) :
      riskBand === 'AMBER' ? rgb(0.8, 0.55, 0.0) :
      rgb(0.75, 0.1, 0.1);

    page1.drawText('Risk Assessment', { x: 40, y, size: 13, font: boldFont });
    y -= 20;
    if (riskSnapshot) {
      page1.drawText(`Risk Score: ${riskSnapshot.score}/100  —  Band: ${riskBand}`, {
        x: 40, y, size: 12, font: boldFont, color: riskColor,
      });
      y -= 16;
      page1.drawText(`Snapshot Date: ${riskSnapshot.createdAt.toISOString().slice(0, 10)}`, { x: 40, y, size: 10, font });
    } else {
      page1.drawText('No risk snapshot available.', { x: 40, y, size: 11, font, color: rgb(0.5, 0.5, 0.5) });
    }

    y -= 28;
    page1.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    // Substance summary
    page1.drawText('Substance Documents', { x: 40, y, size: 13, font: boldFont });
    y -= 20;
    page1.drawText(`Total on file: ${substanceDocs.length}`, { x: 40, y, size: 11, font });
    y -= 16;
    page1.drawText(`Active: ${activeDocCount}`, { x: 40, y, size: 11, font, color: rgb(0.1, 0.55, 0.1) });
    y -= 16;
    page1.drawText(`Expired / Inactive: ${expiredDocCount}`, { x: 40, y, size: 11, font, color: rgb(0.75, 0.1, 0.1) });

    // Footer
    page1.drawText(
      'This report is electronically generated by TaxSentry. It does not constitute legal or tax advice.',
      { x: 40, y: 40, size: 8, font, color: rgb(0.5, 0.5, 0.5) },
    );

    // ── PAGE 2: Substance Document Detail ──────────────────────────────────────
    let page2 = pdfDoc.addPage([W, H]);
    page2.drawRectangle({ x: 0, y: H - 50, width: W, height: 50, color: rgb(0.05, 0.25, 0.6) });
    page2.drawText('Substance Document Detail', { x: 40, y: H - 32, size: 14, font: boldFont, color: rgb(1, 1, 1) });

    let y2 = H - 80;

    if (substanceDocs.length === 0) {
      page2.drawText('No substance documents on file.', { x: 40, y: y2, size: 11, font, color: rgb(0.5, 0.5, 0.5) });
    } else {
      for (const doc of substanceDocs) {
        if (y2 < 80) {
          page2 = pdfDoc.addPage([W, H]);
          y2 = H - 50;
        }
        const docColor = doc.status === 'ACTIVE' ? rgb(0.1, 0.55, 0.1) : rgb(0.75, 0.1, 0.1);
        page2.drawText(doc.displayName, { x: 40, y: y2, size: 10, font: boldFont });
        y2 -= 13;
        page2.drawText(
          `Status: ${doc.status}  |  File: ${doc.fileName}  |  Uploaded: ${doc.uploadedAt.toISOString().slice(0, 10)}`,
          { x: 40, y: y2, size: 9, font, color: docColor },
        );
        if (doc.expiresAt) {
          y2 -= 12;
          page2.drawText(`Expires: ${doc.expiresAt.toISOString().slice(0, 10)}`, { x: 40, y: y2, size: 9, font });
        }
        y2 -= 20;
      }
    }

    page2.drawText(
      'This report is electronically generated by TaxSentry. It does not constitute legal or tax advice.',
      { x: 40, y: 40, size: 8, font, color: rgb(0.5, 0.5, 0.5) },
    );

    // Persist record
    await this.prisma.reportRecord.create({
      data: {
        orgId,
        taxPeriodId,
        type: 'EXECUTIVE_SUMMARY',
        generatedByUserId: userId,
        status: 'COMPLETED',
        parametersJson: { taxPeriodId },
      },
    });

    this.logger.log(`Executive Summary generated for org=${orgId} period=${taxPeriodId}`);
    return Buffer.from(await pdfDoc.save());
  }

  // ── NEW: Report History ───────────────────────────────────────────────────────
  async getReportHistory(
    orgId: string,
    filters: { type?: string; page?: number },
  ) {
    const PAGE_SIZE = 20;
    const page = Math.max(1, filters.page ?? 1);
    const skip = (page - 1) * PAGE_SIZE;

    const where = {
      orgId,
      ...(filters.type ? { type: filters.type } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.reportRecord.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          type: true,
          taxPeriodId: true,
          generatedAt: true,
          generatedByUserId: true,
          status: true,
          errorText: true,
          parametersJson: true,
        },
      }),
      this.prisma.reportRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  }
}
