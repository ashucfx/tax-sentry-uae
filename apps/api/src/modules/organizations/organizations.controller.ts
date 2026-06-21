import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole, FreeZone } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsEmail,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';

class SetupOrgDto {
  @IsString() name: string;
  @IsString() tradeLicenseNo: string;
  @IsEnum(FreeZone) freeZone: FreeZone;
  @IsDateString() taxPeriodStart: string;
  @IsDateString() taxPeriodEnd: string;
  @IsOptional() @IsString() taxRegistrationNo?: string;
}

class InviteUserDto {
  @IsEmail() email: string;
  @IsEnum(UserRole) role: UserRole;
}

class ChangeMemberRoleDto {
  @IsEnum(UserRole) role: UserRole;
}

class TransferOwnershipDto {
  @IsString() @IsNotEmpty() userId: string;
}

class UpdateBillingDto {
  @IsOptional() @IsEmail() billingEmail?: string;
  @IsOptional() @IsString() billingAddress?: string;
}

class DeleteOrganizationDto {
  @IsString() @IsNotEmpty() confirmation: string;
}

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

  @Post('me/setup')
  @ApiOperation({ summary: 'Complete org onboarding — sets real details and creates first TaxPeriod' })
  @Roles(UserRole.OWNER)
  async setup(@CurrentUser('orgId') orgId: string, @Body() dto: SetupOrgDto) {
    return this.orgService.setupOrg(orgId, dto);
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

  // ── Team / Invitations ───────────────────────────────────────────────────────

  @Post('me/invite')
  @ApiOperation({ summary: 'Invite a user to join the organization (OWNER only)' })
  @Roles(UserRole.OWNER)
  async inviteUser(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.orgService.inviteUser(orgId, userId, dto.email, dto.role);
  }

  @Get('me/invitations')
  @ApiOperation({ summary: 'List pending invitations for this org (OWNER only)' })
  @Roles(UserRole.OWNER)
  async listInvitations(@CurrentUser('orgId') orgId: string) {
    return this.orgService.listInvitations(orgId);
  }

  @Get('me/members')
  @ApiOperation({ summary: 'List active members for this org (OWNER only)' })
  @Roles(UserRole.OWNER)
  async listMembers(@CurrentUser('orgId') orgId: string) {
    return this.orgService.listMembers(orgId);
  }

  @Delete('me/invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a pending invitation (OWNER only)' })
  @Roles(UserRole.OWNER)
  async revokeInvitation(
    @CurrentUser('orgId') orgId: string,
    @Param('id') invitationId: string,
  ) {
    await this.orgService.revokeInvitation(orgId, invitationId);
  }

  // ── Notification Preferences ─────────────────────────────────────────────────

  @Get('me/notifications')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotifications(@CurrentUser('orgId') orgId: string) {
    return { data: await this.orgService.getNotificationPrefs(orgId) };
  }

  @Patch('me/notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async updateNotifications(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: Record<string, boolean>,
  ) {
    return { data: await this.orgService.updateNotificationPrefs(orgId, dto) };
  }

  // ── Member management ─────────────────────────────────────────────────────────

  @Patch('me/members/:userId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a member\'s role (OWNER only). Cannot assign OWNER role.' })
  @Roles(UserRole.OWNER)
  async changeMemberRole(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: ChangeMemberRoleDto,
  ) {
    return { data: await this.orgService.changeMemberRole(orgId, actorId, targetUserId, dto.role) };
  }

  @Delete('me/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a member and revoke all their sessions (OWNER only)' })
  @Roles(UserRole.OWNER)
  async deactivateMember(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.orgService.deactivateMember(orgId, actorId, targetUserId);
  }

  @Post('me/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer OWNER role to another member (OWNER only). Current owner becomes FINANCE.' })
  @Roles(UserRole.OWNER)
  async transferOwnership(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return { data: await this.orgService.transferOwnership(orgId, actorId, dto.userId) };
  }

  @Post('me/invitations/:id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend a pending invitation with a fresh expiry (OWNER only)' })
  @Roles(UserRole.OWNER)
  async resendInvitation(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Param('id') invitationId: string,
  ) {
    return { data: await this.orgService.resendInvitation(orgId, actorId, invitationId) };
  }

  // ── Billing & Configuration ───────────────────────────────────────────────────

  @Patch('me/billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update billing email and address (OWNER only)' })
  @Roles(UserRole.OWNER)
  async updateBilling(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateBillingDto,
  ) {
    return { data: await this.orgService.updateBilling(orgId, actorId, dto) };
  }

  @Patch('me/thresholds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update custom alert thresholds (OWNER, FINANCE)' })
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async updateThresholds(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return { data: await this.orgService.updateAlertThresholds(orgId, actorId, dto) };
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export all org data as JSON attachment (OWNER only)' })
  @Roles(UserRole.OWNER)
  async exportData(
    @CurrentUser('orgId') orgId: string,
    @Res({ passthrough: false }) res: FastifyReply,
  ) {
    const payload = await this.orgService.exportOrgData(orgId);
    const filename = `taxsentry-export-${orgId}-${new Date().toISOString().slice(0, 10)}.json`;
    res
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(JSON.stringify(payload, null, 2));
  }

  @Post('me/dpa-accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept the Data Processing Agreement (OWNER only)' })
  @Roles(UserRole.OWNER)
  async acceptDpa(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return { data: await this.orgService.acceptDpa(orgId, actorId) };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete the organization. Requires body { confirmation: "DELETE" } (OWNER only)' })
  @Roles(UserRole.OWNER)
  async deleteOrganization(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: DeleteOrganizationDto,
  ) {
    await this.orgService.softDeleteOrganization(orgId, actorId, dto.confirmation);
  }

  // ── Onboarding Status ─────────────────────────────────────────────────────────

  @Get('me/onboarding')
  @ApiOperation({ summary: 'Get onboarding progress for current org' })
  async getOnboarding(@CurrentUser('orgId') orgId: string) {
    return { data: await this.orgService.getOnboardingStatus(orgId) };
  }
}
