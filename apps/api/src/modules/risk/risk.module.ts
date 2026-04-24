import { Module } from '@nestjs/common';
import { RiskEngine } from './risk.engine';
import { RiskController } from './risk.controller';
import { DeMinimisModule } from '../deminimis/deminimis.module';

@Module({
  imports: [DeMinimisModule],
  controllers: [RiskController],
  providers: [RiskEngine],
  exports: [RiskEngine],
})
export class RiskModule {}
