import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RiskEngine } from './risk.engine';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('risk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('risk')
export class RiskController {
  constructor(
    private readonly riskEngine: RiskEngine,
    private readonly prisma: PrismaService,
  ) {}

  @Get('score')
  @ApiOperation({ summary: 'Get current risk score with breakdown and recommendations' })
  async getScore(
    @CurrentUser('orgId') orgId: string,
    @Query('taxPeriodId') taxPeriodId?: string,
  ) {
    const period = taxPeriodId
      ? await this.prisma.taxPeriod.findFirst({ where: { id: taxPeriodId, orgId } })
      : await this.prisma.taxPeriod.findFirst({
          where: { orgId, status: 'OPEN' },
          orderBy: { startDate: 'desc' },
        });

    if (!period) throw new NotFoundException('No open tax period found');

    // Get prior score for delta calculation
    const priorSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { snapshotDate: 'desc' },
    });

    const breakdown = await this.riskEngine.calculate({
      orgId,
      taxPeriodId: period.id,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      priorScore: priorSnapshot?.score ?? null,
    });

    return breakdown;
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'Get weekly risk score trend line' })
  async getTrend(
    @CurrentUser('orgId') orgId: string,
    @Query('weeks') weeks = 12,
  ) {
    const since = new Date();
    since.setDate(since.getDate() - Math.min(+weeks, 52) * 7);

    return this.prisma.riskSnapshot.findMany({
      where: { orgId, snapshotDate: { gte: since } },
      orderBy: { snapshotDate: 'asc' },
      select: {
        id: true,
        snapshotDate: true,
        score: true,
        bandColor: true,
        deltaVsPrior: true,
        explanationText: true,
      },
    });
  }

  @Post('snapshot')
  @ApiOperation({ summary: 'Persist a risk score snapshot (run weekly via cron)' })
  async createSnapshot(@CurrentUser('orgId') orgId: string) {
    const period = await this.prisma.taxPeriod.findFirst({
      where: { orgId, status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });

    if (!period) throw new NotFoundException('No open tax period found');

    const priorSnapshot = await this.prisma.riskSnapshot.findFirst({
      where: { orgId },
      orderBy: { snapshotDate: 'desc' },
    });

    const breakdown = await this.riskEngine.calculate({
      orgId,
      taxPeriodId: period.id,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      priorScore: priorSnapshot?.score ?? null,
    });

    const snapshot = await this.prisma.riskSnapshot.create({
      data: {
        orgId,
        snapshotDate: new Date(),
        score: breakdown.total,
        bandColor: breakdown.band,
        deMinimisScore: breakdown.components.deMinimis.score,
        substanceScore: breakdown.components.substance.score,
        auditReadinessScore: breakdown.components.auditReadiness.score,
        relatedPartyScore: breakdown.components.relatedParty.score,
        classificationScore: breakdown.components.classificationConfidence.score,
        breakdownJson: breakdown.components as object,
        explanationText: breakdown.plainEnglishSummary,
        deltaVsPrior: breakdown.deltaVsPrior,
        nqrAmount: 0,
        totalRevenue: 0,
        nqrPercentage: 0,
      },
    });

    return snapshot;
  }
}
