import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const SYNC_QUEUE = 'sync';
export const CLASSIFICATION_QUEUE = 'classification';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: SYNC_QUEUE,
    }),
    BullModule.registerQueue({
      name: CLASSIFICATION_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
