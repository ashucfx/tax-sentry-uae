import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DeMinimisEngine } from '../deminimis/deminimis.engine';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deMinimisEngine: DeMinimisEngine,
  ) {}

  async generateFtaAuditPack(orgId: string): Promise<Buffer> {
    this.logger.log(`Generating FTA Audit Pack for org ${orgId}`);

    const [org, period] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
      }),
      this.prisma.taxPeriod.findFirst({
        where: { orgId, status: 'OPEN' },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    page.drawText('TaxSentry - FTA Audit Pack', {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.3, 0.7),
    });

    page.drawText(`Company: ${org?.name || 'N/A'}`, {
      x: 50,
      y: height - 90,
      size: 12,
      font,
    });

    page.drawText(`Free Zone: ${org?.freeZone || 'N/A'}`, {
      x: 50,
      y: height - 110,
      size: 12,
      font,
    });

    page.drawText(`TRN: ${org?.taxRegistrationNo || 'Not Registered'}`, {
      x: 50,
      y: height - 130,
      size: 12,
      font,
    });

    page.drawLine({
      start: { x: 50, y: height - 150 },
      end: { x: width - 50, y: height - 150 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText('Compliance Summary', {
      x: 50,
      y: height - 180,
      size: 16,
      font: boldFont,
    });

    let dmStatus = 'N/A';
    let totalRevenue = '0.00';
    let qi = '0.00 (0%)';
    let nqi = '0.00 (0%)';
    let color = rgb(0.5, 0.5, 0.5);

    if (period) {
      const dm = await this.deMinimisEngine.calculate({
        orgId,
        taxPeriodId: period.id,
        periodStart: period.startDate,
        periodEnd: period.endDate,
      });

      dmStatus = dm.isBreached ? 'BREACHED' : 'Compliant';
      color = dm.isBreached ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0.2);
      
      const total = dm.totalRevenue.toNumber();
      totalRevenue = total.toLocaleString('en-US', { minimumFractionDigits: 2 });
      
      const nqiAmount = dm.nqrAmount.toNumber();
      const qiAmount = total - nqiAmount;
      
      const nqiPct = total > 0 ? (nqiAmount / total) * 100 : 0;
      const qiPct = total > 0 ? (qiAmount / total) * 100 : 0;

      qi = `${qiAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${qiPct.toFixed(1)}%)`;
      nqi = `${nqiAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${nqiPct.toFixed(1)}%)`;
    } else {
      dmStatus = 'No Open Period';
    }

    page.drawText(`De-Minimis Status: ${dmStatus}`, {
      x: 50,
      y: height - 210,
      size: 12,
      font: boldFont,
      color,
    });

    page.drawText(`Total Revenue (AED): ${totalRevenue}`, {
      x: 50,
      y: height - 230,
      size: 12,
      font,
    });

    page.drawText(`Qualifying Revenue (AED): ${qi}`, {
      x: 50,
      y: height - 250,
      size: 12,
      font,
    });

    page.drawText(`Non-Qualifying Revenue (AED): ${nqi}`, {
      x: 50,
      y: height - 270,
      size: 12,
      font,
    });

    const riskSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    
    let riskText = 'Risk Score: N/A';
    let riskColor = rgb(0.5, 0.5, 0.5);
    if (riskSnapshot) {
      riskText = `Risk Score: ${riskSnapshot.score} / 100 (${riskSnapshot.bandColor})`;
      if (riskSnapshot.bandColor === 'GREEN') riskColor = rgb(0, 0.6, 0.2);
      else if (riskSnapshot.bandColor === 'AMBER') riskColor = rgb(0.8, 0.6, 0);
      else riskColor = rgb(0.8, 0, 0);
    }
    
    page.drawText(riskText, {
      x: 50,
      y: height - 290,
      size: 12,
      font: boldFont,
      color: riskColor,
    });

    page.drawText('This document is electronically generated and immutable.', {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Page 2: Substance Documents
    const docs = await this.prisma.substanceDocument.findMany({
      where: { orgId, isDeleted: false },
      orderBy: { docType: 'asc' },
    });

    let page2 = pdfDoc.addPage([width, height]);
    
    page2.drawText('Substance Document Log', {
      x: 50,
      y: height - 50,
      size: 16,
      font: boldFont,
    });
    
    let y = height - 90;
    
    if (docs.length === 0) {
      page2.drawText('No substance documents on file.', {
        x: 50,
        y,
        size: 12,
        font,
      });
    } else {
      for (const doc of docs) {
        if (y < 60) {
          page2 = pdfDoc.addPage([width, height]);
          y = height - 50;
        }

        const docColor = doc.status === 'ACTIVE' ? rgb(0, 0.6, 0.2) : rgb(0.8, 0, 0);
        page2.drawText(`${doc.displayName}`, { x: 50, y, size: 10, font: boldFont });
        y -= 14;
        page2.drawText(
          `Status: ${doc.status}  |  File: ${doc.fileName}  |  Uploaded: ${doc.uploadedAt.toISOString().slice(0, 10)}`,
          { x: 50, y, size: 9, font, color: docColor },
        );
        if (doc.expiresAt) {
          y -= 12;
          page2.drawText(`Expires: ${doc.expiresAt.toISOString().slice(0, 10)}`, { x: 50, y, size: 9, font });
        }
        y -= 25;
      }
    }

    page2.drawText('This document is electronically generated and immutable.', {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
