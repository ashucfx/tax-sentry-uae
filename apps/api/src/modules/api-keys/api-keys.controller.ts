import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipSubscriptionCheck } from '../../common/guards/subscription.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';

class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipSubscriptionCheck()
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a new API key (full key shown only once)' })
  async create(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createApiKey(orgId, userId, dto.name, dto.expiresAt);
  }

  @Get()
  @ApiOperation({ summary: 'List active API keys (never returns the key hash)' })
  async list(@CurrentUser('orgId') orgId: string) {
    return { data: await this.apiKeysService.listApiKeys(orgId) };
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke (soft-delete) an API key' })
  async revoke(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.apiKeysService.deleteApiKey(orgId, userId, id);
  }
}
