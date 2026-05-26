import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QueueConfigService } from './queue-config.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (queueConfig: QueueConfigService) => ({
        redis: queueConfig.redisUrl ?? {
          host: queueConfig.redisHost,
          port: queueConfig.redisPort,
          password: queueConfig.redisPassword,
          db: queueConfig.redisDb,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [QueueConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'order-processing',
        defaultJobOptions: {
          delay: 0,
          attempts: 5,
        },
      },
      {
        name: 'payment-processing',
        defaultJobOptions: {
          delay: 0,
          attempts: 3,
        },
      },
      {
        name: 'email-notifications',
        defaultJobOptions: {
          delay: 0,
          attempts: 3,
        },
      },
      {
        name: 'inventory-updates',
        defaultJobOptions: {
          delay: 0,
          attempts: 3,
        },
      },
      {
        name: 'search-indexing',
        defaultJobOptions: {
          delay: 0,
          attempts: 3,
        },
      },
    ),
  ],
  providers: [QueueConfigService],
  exports: [BullModule, QueueConfigService],
})
export class QueueModule {}
