import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SubstanceModule } from '../substance/substance.module';

@Module({
  imports: [SubstanceModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
