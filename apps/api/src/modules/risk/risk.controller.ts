import { Controller, Get, Post, Query, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RiskEngine } from './risk.engine';
import { PrismaService } from '../prisma/prisma.service';
import { SimulateRiskDto } from './dto/simulate-risk.dto';

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

  @Get('score/breakdown/:component')
  @ApiOperation({ summary: 'Drill down on a specific risk component with contributing transactions' })
  async getBreakdown(
    @CurrentUser('orgId') orgId: string,
    @Param('component') component: string,
  ) {
    return this.riskEngine.getRiskBreakdown(orgId, component);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate risk score with hypothetical data changes — does not persist' })
  async simulate(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: SimulateRiskDto,
  ) {
    return this.riskEngine.simulateRisk(orgId, dto);
  }
}
