import { Module } from '@nestjs/common';
import { ClassificationEngine } from './classification.engine';

@Module({
  providers: [ClassificationEngine],
  exports: [ClassificationEngine],
})
export class ClassificationModule {}
