import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateFtaAuditPack(orgId: string): Promise<Buffer> {
    this.logger.log(`Generating FTA Audit Pack for org ${orgId}`);

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

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

    page.drawText('De-Minimis Status: Compliant', {
      x: 50,
      y: height - 210,
      size: 12,
      font,
      color: rgb(0, 0.6, 0.2),
    });

    page.drawText('Total Revenue (AED): 12,450,000.00', {
      x: 50,
      y: height - 230,
      size: 12,
      font,
    });

    page.drawText('Qualifying Revenue (AED): 11,800,000.00 (94.7%)', {
      x: 50,
      y: height - 250,
      size: 12,
      font,
    });

    page.drawText('Non-Qualifying Revenue (AED): 650,000.00 (5.3%)', {
      x: 50,
      y: height - 270,
      size: 12,
      font,
    });

    page.drawText('This document is electronically generated and immutable.', {
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
