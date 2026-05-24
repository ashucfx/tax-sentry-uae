import { Controller, Get, Post, UseGuards, Req, Res, Query, Body, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('status')
  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.VIEWER, UserRole.AUDITOR)
  async getStatus(@Req() req: any) {
    const orgId = req.user.orgId;
    return this.integrationsService.getIntegrationsStatus(orgId);
  }

  @Post('connect/mock')
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async connectMockIntegration(@Req() req: any, @Body() body: { provider: string }) {
    const orgId = req.user.orgId;
    return this.integrationsService.connectMockIntegration(orgId, body.provider);
  }

  @Post('sync')
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async triggerSync(@Req() req: any, @Body() body: { provider: string }) {
    const orgId = req.user.orgId;
    return this.integrationsService.triggerSync(orgId, body.provider);
  }
}
