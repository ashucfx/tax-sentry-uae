import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { SubstanceModule } from '../substance/substance.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SubstanceModule, PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfGeneratorService],
})
export class ReportsModule {}
