import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
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
}
