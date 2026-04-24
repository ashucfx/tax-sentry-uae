import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsInt, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsEngine } from './alerts.engine';
import { PrismaService } from '../prisma/prisma.service';
import { Type } from 'class-transformer';

class SnoozeAlertDto {
  @IsString()
  @MinLength(10)
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  days?: number = 7;
}

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsEngine: AlertsEngine,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List alerts for the organization' })
  async list(
    @CurrentUser('orgId') orgId: string,
    @Query('isResolved') isResolved?: boolean,
    @Query('severity') severity?: string,
    @Query('limit') limit = 20,
  ) {
    const alerts = await this.prisma.alert.findMany({
      where: {
        orgId,
        ...(isResolved !== undefined && { isResolved: isResolved === true || (isResolved as any) === 'true' }),
        ...(severity && { severity: severity as any }),
        // Don't show snoozed alerts
        OR: [
          { snoozedUntil: null },
          { snoozedUntil: { lt: new Date() } },
        ],
      },
      orderBy: [
        { severity: 'desc' },
        { triggeredAt: 'desc' },
      ],
      take: Math.min(+limit, 100),
    });

    return { alerts, total: alerts.length };
  }

  @Patch(':id/acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledge(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.alertsEngine.acknowledgeAlert(id, orgId, userId);
  }

  @Post(':id/snooze')
  @ApiOperation({ summary: 'Snooze an AMBER alert (RED alerts cannot be snoozed)' })
  async snooze(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SnoozeAlertDto,
  ) {
    await this.alertsEngine.snoozeAlert(id, orgId, userId, dto.reason, dto.days);
    return { message: `Alert snoozed for ${dto.days} days` };
  }
}
