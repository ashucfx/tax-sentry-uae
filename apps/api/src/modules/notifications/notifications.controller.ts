import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SkipSubscriptionCheck } from '../../common/guards/subscription.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class PageQuery {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SkipSubscriptionCheck()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'List unresolved alerts for the in-app notification bell' })
  async getAlerts(@CurrentUser('orgId') orgId: string) {
    const alerts = await this.notificationsService.getInAppAlerts(orgId);
    return { data: alerts, total: alerts.length };
  }

  @Patch('alerts/:id/acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.notificationsService.acknowledgeAlert(orgId, id, userId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'List notification delivery history (email logs)' })
  async getLogs(
    @CurrentUser('orgId') orgId: string,
    @Query() query: PageQuery,
  ) {
    return this.notificationsService.getNotificationLogs(orgId, query.page);
  }
}
