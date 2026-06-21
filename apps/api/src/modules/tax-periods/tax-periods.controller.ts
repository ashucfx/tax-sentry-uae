import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaxPeriodsService } from './tax-periods.service';
import { CreateTaxPeriodDto } from './dto/tax-period.dto';

@ApiTags('tax-periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tax-periods')
export class TaxPeriodsController {
  constructor(private readonly taxPeriodsService: TaxPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tax periods for the organisation' })
  async list(@CurrentUser('orgId') orgId: string) {
    return this.taxPeriodsService.listPeriods(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new OPEN tax period' })
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async create(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaxPeriodDto,
  ) {
    return this.taxPeriodsService.createPeriod(orgId, userId, dto);
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock a tax period — prevents further transaction changes' })
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async lock(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.taxPeriodsService.lockPeriod(orgId, userId, id);
  }

  @Post(':id/file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a locked tax period as filed with the FTA' })
  @Roles(UserRole.OWNER)
  async file(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.taxPeriodsService.filePeriod(orgId, userId, id);
  }

  @Post(':id/next')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create the next tax period with same duration starting day after current ends' })
  @Roles(UserRole.OWNER, UserRole.FINANCE)
  async createNext(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.taxPeriodsService.createNextPeriod(orgId, userId, id);
  }
}
