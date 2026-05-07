import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  ) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    return this.prisma.auditLog.findMany({
      where: { orgId },
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
    });
  }
}
