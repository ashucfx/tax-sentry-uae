import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';

class FtaReturnDto {
  taxPeriodId: string;
}

class ExecutiveSummaryDto {
  taxPeriodId: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List available report types for the current org' })
  async list(@CurrentUser('orgId') orgId: string) {
    const period = await this.prisma.taxPeriod.findFirst({
      where: { orgId, status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });

    const fmtDate = (d: Date | null) =>
      d ? d.toISOString().slice(0, 7) : null;

    return {
      reports: [
        {
          id: 'classification-pack',
          title: 'FTA Classification Pack',
          type: 'AUDIT',
          period: period
            ? `${fmtDate(period.startDate)} – ${fmtDate(period.endDate)}`
            : 'No open period',
          taxPeriodId: period?.id ?? null,
          endpoint: '/reports/classification-pack',
          status: period ? 'READY' : 'PENDING',
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'substance-pack',
          title: 'Substance Requirements Pack',
          type: 'SUBSTANCE',
          period: 'Current',
          taxPeriodId: null,
          endpoint: '/reports/substance-pack',
          status: 'READY',
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'fta-return',
          title: 'FTA Annual Return (JSON)',
          type: 'FTA_RETURN',
          period: period
            ? `${fmtDate(period.startDate)} – ${fmtDate(period.endDate)}`
            : 'No open period',
          taxPeriodId: period?.id ?? null,
          endpoint: '/reports/fta-return',
          status: period ? 'READY' : 'PENDING',
          generatedAt: new Date().toISOString(),
        },
        {
          id: 'executive-summary',
          title: 'Executive Summary (PDF)',
          type: 'EXECUTIVE_SUMMARY',
          period: period
            ? `${fmtDate(period.startDate)} – ${fmtDate(period.endDate)}`
            : 'No open period',
          taxPeriodId: period?.id ?? null,
          endpoint: '/reports/executive-summary',
          status: period ? 'READY' : 'PENDING',
          generatedAt: new Date().toISOString(),
        },
      ],
    };
  }

  @Get('classification-pack')
  @ApiOperation({ summary: 'Download Classification Pack PDF for FTA audit' })
  async downloadClassificationPack(
    @CurrentUser('orgId') orgId: string,
    @Query('taxPeriodId') taxPeriodId: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.reportsService.generateClassificationPack(orgId, taxPeriodId);
    const filename = `qfzp-classification-pack-${new Date().toISOString().slice(0, 10)}.pdf`;

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('X-Generated-At', new Date().toISOString())
      .send(buffer);
  }

  @Get('substance-pack')
  @ApiOperation({ summary: 'Download Substance Pack PDF for auditor review' })
  async downloadSubstancePack(
    @CurrentUser('orgId') orgId: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.reportsService.generateSubstancePack(orgId);
    const filename = `qfzp-substance-pack-${new Date().toISOString().slice(0, 10)}.pdf`;

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('X-Generated-At', new Date().toISOString())
      .send(buffer);
  }

  @Get('fta-pack/pdf')
  @ApiOperation({ summary: 'Download complete FTA Audit Pack PDF' })
  async downloadFtaPack(
    @CurrentUser('orgId') orgId: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.pdfGenerator.generateFtaAuditPack(orgId);
    const filename = `fta-audit-pack-${new Date().toISOString().slice(0, 10)}.pdf`;

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('X-Generated-At', new Date().toISOString())
      .send(buffer);
  }

  // ── POST /reports/fta-return ─────────────────────────────────────────────────
  @Post('fta-return')
  @ApiOperation({ summary: 'Generate and download QFZP Annual FTA Return as JSON' })
  @ApiBody({ schema: { properties: { taxPeriodId: { type: 'string' } }, required: ['taxPeriodId'] } })
  async generateFtaReturn(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: FtaReturnDto,
    @Res() reply: FastifyReply,
  ) {
    const data = await this.reportsService.generateFtaReturn(orgId, userId, dto.taxPeriodId);
    const filename = `fta-return-${new Date().toISOString().slice(0, 10)}.json`;

    reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('X-Generated-At', new Date().toISOString())
      .send(JSON.stringify(data, null, 2));
  }

  // ── POST /reports/executive-summary ─────────────────────────────────────────
  @Post('executive-summary')
  @ApiOperation({ summary: 'Generate and download Executive Summary PDF' })
  @ApiBody({ schema: { properties: { taxPeriodId: { type: 'string' } }, required: ['taxPeriodId'] } })
  async generateExecutiveSummary(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ExecutiveSummaryDto,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.reportsService.generateExecutiveSummary(orgId, userId, dto.taxPeriodId);
    const filename = `executive-summary-${new Date().toISOString().slice(0, 10)}.pdf`;

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('X-Generated-At', new Date().toISOString())
      .send(buffer);
  }

  // ── GET /reports/history ─────────────────────────────────────────────────────
  @Get('history')
  @ApiOperation({ summary: 'Get report generation history for this org' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by report type (FTA_RETURN, EXECUTIVE_SUMMARY, COMPLIANCE_REPORT)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (20 records per page)' })
  async getReportHistory(
    @CurrentUser('orgId') orgId: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const result = await this.reportsService.getReportHistory(orgId, {
      type,
      page: isNaN(pageNum) ? 1 : pageNum,
    });
    return { data: result };
  }
}
