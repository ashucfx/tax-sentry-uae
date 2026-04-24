import { Module } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { ClassificationModule } from '../classification/classification.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [ClassificationModule, AlertsModule],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
