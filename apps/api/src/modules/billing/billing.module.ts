import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { SubscriptionCronService } from './subscription-cron.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, SubscriptionCronService],
  exports: [BillingService],
})
export class BillingModule {}
