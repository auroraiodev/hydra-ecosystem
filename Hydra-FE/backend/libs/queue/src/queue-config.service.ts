import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueConfigService {
  constructor(private configService: ConfigService) {}

  get redisUrl(): string | undefined {
    return this.configService.get<string>('REDIS_URL');
  }
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }
  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }
  get redisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }
  get redisDb(): number {
    return this.configService.get<number>('REDIS_DB', 1);
  }

  getQueueConfig(queueName: string) {
    const configs: Record<string, any> = {
      'order-processing': {
        concurrency: 5,
        delay: 0,
        attempts: 5,
        backoff: 'exponential',
        removeOnComplete: 100,
        removeOnFail: 50,
      },
      'payment-processing': {
        concurrency: 3,
        delay: 0,
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 100,
        removeOnFail: 50,
      },
      'email-notifications': {
        concurrency: 10,
        delay: 0,
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 200,
        removeOnFail: 100,
      },
      'inventory-updates': {
        concurrency: 8,
        delay: 0,
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 100,
        removeOnFail: 50,
      },
      'search-indexing': {
        concurrency: 2,
        delay: 0,
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    };
    return configs[queueName] || configs['order-processing'];
  }

  getPriority(jobType: string): number {
    const priorities: Record<string, number> = {
      'payment-processing': 10,
      'order-processing': 8,
      'inventory-updates': 5,
      'email-notifications': 3,
      'search-indexing': 1,
    };
    return priorities[jobType] || 5;
  }
}
