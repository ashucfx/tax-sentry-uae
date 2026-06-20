import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { SupportCategory } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipSubscriptionCheck } from '../../common/guards/subscription.guard';
import { SupportService } from './support.service';

class SubmitSupportDto {
  @IsEnum(SupportCategory)
  category: SupportCategory;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  priority?: string;
}

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@SkipSubscriptionCheck()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit a support request' })
  async submit(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitSupportDto,
  ) {
    return { data: await this.supportService.submit(orgId, userId, dto) };
  }

  @Get('requests')
  @ApiOperation({ summary: 'List own support requests' })
  async listRequests(@CurrentUser('orgId') orgId: string) {
    return { data: await this.supportService.listRequests(orgId) };
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get a specific support request' })
  async getRequest(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return { data: await this.supportService.getRequest(orgId, id) };
  }
}
