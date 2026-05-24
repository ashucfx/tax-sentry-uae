import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SYNC_QUEUE } from '../../common/queues/queues.module';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SYNC_QUEUE) private syncQueue: Queue,
  ) {}

  async getIntegrationsStatus(orgId: string) {
    // In a real system, we'd query an Integration model. We'll use mock responses.
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { 
        // Assume we added an integration config json to org, or we just mock it for now.
        // Actually, let's just mock it since we don't have schema updates for integrations yet.
      }
    });

    return {
      xero: { connected: false, lastSync: null },
      zoho: { connected: false, lastSync: null },
    };
  }

  async connectMockIntegration(orgId: string, provider: string) {
    if (!['xero', 'zoho'].includes(provider)) {
      throw new BadRequestException('Invalid provider');
    }

    this.logger.log(`Mock connecting ${provider} for org ${orgId}`);
    
    // Trigger an immediate sync to pull mock historical data
    await this.triggerSync(orgId, provider);
    
    return { success: true, message: `${provider} connected successfully.` };
  }

  async triggerSync(orgId: string, provider: string) {
    this.logger.log(`Queueing sync job for ${provider} - org: ${orgId}`);
    
    await this.syncQueue.add('sync-ledger', {
      orgId,
      provider,
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return { success: true, message: 'Sync queued successfully' };
  }
}
