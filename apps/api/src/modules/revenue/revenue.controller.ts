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
} from '@nestjs/common';
import { FileInterceptor } from '../../common/interceptors/fastify-file.interceptor';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UserRole, Classification } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RevenueService } from './revenue.service';
import { CreateTransactionDto, OverrideClassificationDto } from './dto/create-transaction.dto';

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
  ) {
    const csvContent = file.buffer.toString('utf-8');
    const rows = this.parseCsv(csvContent);
    return this.revenueService.processCsvImport(orgId, taxPeriodId, rows, userId);
  }

  private parseCsv(content: string): Array<Record<string, string>> {
    const cleaned = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleaned.split('\n');
    const nonEmpty = lines.filter((l) => l.trim());
    if (nonEmpty.length < 2) return [];

    const headers = this.parseCsvLine(nonEmpty[0]).map((h) => h.toLowerCase());
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < nonEmpty.length; i++) {
      const values = this.parseCsvLine(nonEmpty[i]);
      if (values.every((v) => v === '')) continue; // skip blank rows
      rows.push(Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ''])));
    }

    return rows;
  }

  // RFC 4180 compliant single-line parser \u2014 handles quoted fields with embedded commas and escaped quotes
  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          // Doubled quote inside quoted field = escaped quote character
          if (i + 1 < line.length && line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === ',') {
          fields.push(field.trim());
          field = '';
          i++;
        } else {
          field += ch;
          i++;
        }
      }
    }

    fields.push(field.trim());
    return fields;
  }
}
