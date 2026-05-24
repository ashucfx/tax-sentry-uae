import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { getQueueToken } from '@nestjs/bullmq';

export const SYNC_QUEUE = 'sync';
export const CLASSIFICATION_QUEUE = 'classification';

const mockQueueProvider = (name: string) => ({
  provide: getQueueToken(name),
  useValue: {
    add: async () => ({ id: 'mock-job-id' }),
    getJobs: async () => [],
    getJobCounts: async () => ({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }),
    pause: async () => {},
    resume: async () => {},
    obliterate: async () => {},
  },
});

@Global()
@Module({
  providers: [
    mockQueueProvider(SYNC_QUEUE),
    mockQueueProvider(CLASSIFICATION_QUEUE),
  ],
  exports: [
    getQueueToken(SYNC_QUEUE),
    getQueueToken(CLASSIFICATION_QUEUE),
  ],
})
export class QueuesModule {}
