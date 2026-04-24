import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
