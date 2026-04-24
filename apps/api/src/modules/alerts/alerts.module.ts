import { Module } from '@nestjs/common';
import { AlertsEngine } from './alerts.engine';
import { AlertsController } from './alerts.controller';
import { AlertsScheduler } from './alerts.scheduler';
import { EmailService } from './email.service';
import { DeMinimisModule } from '../deminimis/deminimis.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [DeMinimisModule, RiskModule],
  controllers: [AlertsController],
  providers: [AlertsEngine, AlertsScheduler, EmailService],
  exports: [AlertsEngine, EmailService],
})
export class AlertsModule {}
