import { Module } from '@nestjs/common';
import { TaxPeriodsController } from './tax-periods.controller';
import { TaxPeriodsService } from './tax-periods.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxPeriodsController],
  providers: [TaxPeriodsService],
  exports: [TaxPeriodsService],
})
export class TaxPeriodsModule {}
