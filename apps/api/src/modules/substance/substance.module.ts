import { Module } from '@nestjs/common';
import { SubstanceService } from './substance.service';
import { SubstanceController } from './substance.controller';

@Module({
  controllers: [SubstanceController],
  providers: [SubstanceService],
  exports: [SubstanceService],
})
export class SubstanceModule {}
