import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-log')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log entries for the current org' })
  async list(
    @CurrentUser('orgId') orgId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where: any = { orgId };
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
        select: {
          id: true,
          actorEmail: true,
          action: true,
          entity: true,
          entityId: true,
          timestamp: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      }
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit log to CSV' })
  async export(
    @CurrentUser('orgId') orgId: string,
    @Res() reply: any,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: any = { orgId };
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const entries = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        entity: true,
        entityId: true,
        timestamp: true,
      },
    });

    const { stringify } = require('csv-stringify/sync');
    const csv = stringify(entries, { header: true });
    
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="audit-log-export.csv"`)
      .send(csv);
  }
}
