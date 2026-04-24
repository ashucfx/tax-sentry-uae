import { Module } from '@nestjs/common';
import { DeMinimisEngine } from './deminimis.engine';
import { DeMinimisController } from './deminimis.controller';

@Module({
  controllers: [DeMinimisController],
  providers: [DeMinimisEngine],
  exports: [DeMinimisEngine],
})
export class DeMinimisModule {}
