import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseBoolPipe,
  DefaultValuePipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '../../common/interceptors/fastify-file.interceptor';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole, Classification } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RevenueService } from './revenue.service';
import {
  CreateTransactionDto,
  OverrideClassificationDto,
  BulkClassifyDto,
  ReclassifyAllDto,
  ResolveReviewFlagDto,
} from './dto/create-transaction.dto';

@ApiTags('revenue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post('transactions')
  @ApiOperation({ summary: 'Create a revenue transaction with auto-classification' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  async create(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('taxPeriodId') taxPeriodId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.revenueService.createTransaction(orgId, taxPeriodId, dto, userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List revenue transactions with filtering and pagination' })
  async list(
    @CurrentUser('orgId') orgId: string,
    @Query('taxPeriodId') taxPeriodId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('classification') classification?: Classification,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('requiresReview') requiresReview?: boolean,
  ) {
    return this.revenueService.getTransactions(orgId, taxPeriodId, {
      page: +page,
      limit: Math.min(+limit, 200),
      classification,
      startDate,
      endDate,
      search,
      requiresReview,
    });
  }
  @Get('transactions/export')
  @ApiOperation({ summary: 'Export revenue transactions to CSV' })
  @Throttle({ short: { limit: 5, ttl: 60000 }, medium: { limit: 10, ttl: 3600000 } })
  async export(
    @CurrentUser('orgId') orgId: string,
    @Query('taxPeriodId') taxPeriodId: string,
    @Query('page') page = 1,
    @Res() reply: any,
  ) {
    const transactions = await this.revenueService.getTransactions(orgId, taxPeriodId, {
      page: +page, limit: 500,
    });

    const { stringify } = require('csv-stringify/sync');
    
    // Mitigate CSV Injection (Formula Injection) by prefixing dangerous characters with a single quote
    const sanitizeCsvField = (val: any) => {
      if (typeof val === 'string' && /^[=+\-@\t\r]/.test(val)) {
        return `'${val}`;
      }
      return val;
    };

    const sanitizedTransactions = transactions.transactions.map((t: any) => {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(t)) {
        sanitized[key] = sanitizeCsvField(value);
      }
      return sanitized;
    });

    const csv = stringify(sanitizedTransactions, { header: true });

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="transactions-export-p${+page}.csv"`)
      .header('X-Total-Count', String(transactions.pagination?.total ?? 0))
      .send(csv);
  }

  @Patch('transactions/:id/classification')
  @ApiOperation({ summary: 'Override transaction classification with audit trail' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  async overrideClassification(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: OverrideClassificationDto,
    @Query('afterPeriodLock', new DefaultValuePipe(false), ParseBoolPipe) afterPeriodLock: boolean,
  ) {
    return this.revenueService.overrideClassification(
      id,
      orgId,
      userId,
      dto,
      afterPeriodLock,
    );
  }

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a transaction (audit log preserved)' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  async delete(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.revenueService.softDeleteTransaction(id, orgId, userId);
  }

  @Post('transactions/csv-import')
  @ApiOperation({ summary: 'Import transactions from CSV — returns imported count + error rows' })
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  @Throttle({ short: { limit: 3, ttl: 60000 }, medium: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('file'))
  async csvImport(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('taxPeriodId') taxPeriodId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /text\/csv|application\/vnd.ms-excel/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('mapping') mappingJson?: string,
  ) {
    const { parse } = require('csv-parse/sync');
    let mapping: Record<string, string> = {};
    if (mappingJson) {
      try {
        mapping = JSON.parse(mappingJson);
      } catch (e) {
        throw new BadRequestException('Invalid mapping JSON');
      }
    }

    try {
      const records = parse(file.buffer, {
        columns: (header: string[]) => header.map((h: string) => {
          const raw = h.trim();
          return mapping[raw] || raw.toLowerCase().replace(/ /g, '_');
        }),
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        bom: true, // Handle UTF-8 BOM
      });

      if (!records || records.length === 0) {
        return [];
      }

      return this.revenueService.processCsvImport(orgId, taxPeriodId, records, userId);
    } catch (error) {
      throw new BadRequestException(`Failed to parse CSV file: ${(error as Error).message}`);
    }
  }

  @Post('transactions/bulk-classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk-classify up to 200 transactions in one atomic operation' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async bulkClassify(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BulkClassifyDto,
  ) {
    if (dto.transactionIds.length > 200) {
      throw new BadRequestException('Cannot classify more than 200 transactions per request');
    }
    return this.revenueService.bulkClassify(orgId, userId, dto);
  }

  @Post('transactions/reclassify-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-run auto-classification engine on all non-overridden transactions in a period' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  @Throttle({ short: { limit: 2, ttl: 60000 } })
  async reclassifyAll(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReclassifyAllDto,
  ) {
    return this.revenueService.reclassifyAll(orgId, userId, dto.taxPeriodId);
  }

  @Get('transactions/review-queue')
  @ApiOperation({ summary: 'List transactions flagged for manual review, paginated' })
  async getReviewQueue(
    @CurrentUser('orgId') orgId: string,
    @Query('taxPeriodId') taxPeriodId?: string,
    @Query('page') page = 1,
  ) {
    const limit = 50;
    return this.revenueService.getReviewQueue(orgId, taxPeriodId, +page, limit);
  }

  @Patch('transactions/:id/review')
  @ApiOperation({ summary: 'Resolve or update the review flag on a transaction' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  async resolveReviewFlag(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResolveReviewFlagDto,
  ) {
    return this.revenueService.resolveReviewFlag(orgId, userId, id, dto);
  }
}
