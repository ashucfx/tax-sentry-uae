import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '../../common/interceptors/fastify-file.interceptor';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubstanceService } from './substance.service';

@ApiTags('substance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('substance')
export class SubstanceController {
  constructor(private readonly substanceService: SubstanceService) {}

  @Get('checklist')
  @ApiOperation({ summary: 'Get substance document checklist with status for each required type' })
  async getChecklist(@CurrentUser('orgId') orgId: string) {
    return this.substanceService.getChecklist(orgId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Alias for /substance/checklist' })
  async getHealth(@CurrentUser('orgId') orgId: string) {
    return this.substanceService.getChecklist(orgId);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload a substance document' })
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('docType') docType: string,
    @Query('expiresAt') expiresAt?: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
      }),
    )
    file?: Express.Multer.File,
  ) {
    if (!file) throw new Error('File is required');

    let parsedExpiresAt: Date | undefined;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        throw new Error('Invalid expiresAt date format');
      }
    }

    return this.substanceService.uploadDocument(orgId, userId, docType, file, parsedExpiresAt);
  }

  @Get('documents/:id/download')
  @ApiOperation({ summary: 'Get signed URL to download a document (1-hour expiry)' })
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    const url = await this.substanceService.getSignedDownloadUrl(id, orgId);
    return { url };
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a substance document (audit log preserved, 7-year retention)' })
  @Roles(UserRole.FINANCE, UserRole.OWNER)
  async delete(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.substanceService.softDeleteDocument(id, orgId, userId);
  }
}
