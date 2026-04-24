import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeMinimisEngine } from './deminimis.engine';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('deminimis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deminimis')
export class DeMinimisController {
  constructor(
    private readonly engine: DeMinimisEngine,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current de-minimis threshold status and projections' })
  async getStatus(
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

    const breakdown = await this.engine.calculate({
      orgId,
      taxPeriodId: period.id,
      periodStart: period.startDate,
      periodEnd: period.endDate,
    });

    return {
      period: {
        id: period.id,
        start: period.startDate,
        end: period.endDate,
        status: period.status,
        daysRemaining: Math.max(
          0,
          Math.floor((period.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        ),
      },
      deMinimis: {
        nqrAmount: breakdown.nqrAmount.toFixed(2),
        totalRevenue: breakdown.totalRevenue.toFixed(2),
        nqrPercentage: breakdown.nqrPercentage.toFixed(4),
        absThreshold: breakdown.absThreshold.toFixed(2),
        pctThreshold: breakdown.pctThreshold.toFixed(2),
        marginToBreachAed: breakdown.marginToBreachAed.toFixed(2),
        marginToBreachPct: breakdown.marginToBreachPct.toFixed(4),
        alertThresholdPct: breakdown.alertThresholdPct,
        isBreached: breakdown.isBreached,
        breachType: breakdown.breachType,
        statusBadge: breakdown.statusBadge,
      },
      projections: {
        projectedNqrAmount: breakdown.projectedNqrAmount?.toFixed(2) ?? null,
        projectedNqrPct: breakdown.projectedNqrPct?.toFixed(4) ?? null,
        projectedBreachRisk: breakdown.projectedBreachRisk,
        daysElapsed: breakdown.daysElapsed,
        daysInPeriod: breakdown.daysInPeriod,
        periodProgress: breakdown.periodProgress,
      },
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get monthly de-minimis breakdown for revenue mix chart' })
  async getMonthlyBreakdown(
    @CurrentUser('orgId') orgId: string,
    @Query('taxPeriodId') taxPeriodId?: string,
  ) {
    const period = taxPeriodId
      ? await this.prisma.taxPeriod.findFirst({ where: { id: taxPeriodId, orgId } })
      : await this.prisma.taxPeriod.findFirst({
          where: { orgId, status: 'OPEN' },
          orderBy: { startDate: 'desc' },
        });

    if (!period) throw new NotFoundException('No tax period found');

    // Monthly aggregation for stacked bar chart
    const monthly = await this.prisma.$queryRaw<
      Array<{
        month: string;
        classification: string;
        total: number;
      }>
    >`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        classification,
        SUM(amount_aed) as total
      FROM revenue_transactions
      WHERE org_id = ${orgId}
        AND tax_period_id = ${period.id}
        AND is_deleted = false
        AND classification != 'UNCLASSIFIED'
      GROUP BY TO_CHAR(date, 'YYYY-MM'), classification
      ORDER BY month ASC, classification ASC
    `;

    // Top 5 NQI counterparties
    const topNqi = await this.prisma.revenueTransaction.groupBy({
      by: ['counterparty'],
      where: {
        orgId,
        taxPeriodId: period.id,
        classification: 'NQI',
        isDeleted: false,
      },
      _sum: { amountAed: true },
      orderBy: { _sum: { amountAed: 'desc' } },
      take: 5,
    });

    return { monthly, topNqiCounterparties: topNqi };
  }
}
