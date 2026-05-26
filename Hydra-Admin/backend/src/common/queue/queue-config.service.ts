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

  // Queue configurations
  getQueueConfig(queueName: string) {
    const configs = {
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

  // Job priorities
  getPriority(jobType: string): number {
    const priorities = {
      'payment-processing': 10, // Highest priority
      'order-processing': 8,
      'inventory-updates': 5,
      'email-notifications': 3,
      'search-indexing': 1, // Lowest priority
    };

    return priorities[jobType] || 5;
  }

  // Rate limiting for queues
  getRateLimit(queueName: string): number {
    const limits = {
      'email-notifications': 100, // 100 emails per minute
      'order-processing': 50, // 50 orders per minute
      'payment-processing': 30, // 30 payments per minute
      'inventory-updates': 200, // 200 updates per minute
      'search-indexing': 20, // 20 index operations per minute
    };

    return limits[queueName] || 50;
  }

  // Retry configurations
  getRetryConfig(queueName: string) {
    const configs = {
      'payment-processing': {
        maxAttempts: 3,
        backoffType: 'exponential',
        backoffDelay: 2000,
      },
      'order-processing': {
        maxAttempts: 5,
        backoffType: 'exponential',
        backoffDelay: 1000,
      },
      'email-notifications': {
        maxAttempts: 3,
        backoffType: 'fixed',
        backoffDelay: 5000,
      },
      'inventory-updates': {
        maxAttempts: 3,
        backoffType: 'exponential',
        backoffDelay: 1000,
      },
      'search-indexing': {
        maxAttempts: 3,
        backoffType: 'exponential',
        backoffDelay: 2000,
      },
    };

    return configs[queueName] || configs['order-processing'];
  }

  // Dead letter queue configuration
  getDeadLetterConfig(queueName: string) {
    return {
      deadLetterQueue: `${queueName}-dlq`,
      deadLetterQueueMaxLen: 1000,
      removeOnFail: false,
      attempts: this.getRetryConfig(queueName).maxAttempts,
    };
  }
}
