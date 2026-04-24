import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current organization profile' })
  async getMe(@CurrentUser('orgId') orgId: string) {
    return this.orgService.findById(orgId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update organization profile' })
  @Roles(UserRole.OWNER)
  async update(@CurrentUser('orgId') orgId: string, @Body() dto: Record<string, unknown>) {
    return this.orgService.update(orgId, dto as any);
  }

  @Get('me/activities')
  @ApiOperation({ summary: 'Get declared qualifying activities' })
  async getActivities(@CurrentUser('orgId') orgId: string) {
    return this.orgService.getActivityDeclarations(orgId);
  }

  @Post('me/activities')
  @ApiOperation({ summary: 'Declare a qualifying activity' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  async declareActivity(
    @CurrentUser('orgId') orgId: string,
    @Body('activityCode') activityCode: string,
  ) {
    return this.orgService.declareActivity(orgId, activityCode);
  }
}
