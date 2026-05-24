import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SYNC_QUEUE } from '../../common/queues/queues.module';

@Processor(SYNC_QUEUE)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing sync job ${job.id} for ${job.data.provider}`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // MOCK: Generate 100 fake transactions and push to DB? 
    // We'll just log success to avoid polluting DB unless requested
    this.logger.log(`Successfully completed sync for ${job.data.provider}`);
    
    return { success: true, rowsSynced: 142 };
  }
}
