import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SyncProcessor } from './sync.processor';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SyncProcessor],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
