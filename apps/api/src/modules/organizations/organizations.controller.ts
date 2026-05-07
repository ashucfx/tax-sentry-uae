import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from 'class-validator';
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
}
