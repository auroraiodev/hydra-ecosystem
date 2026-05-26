import { Injectable } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many requests. Please try again later.';
  protected errorMessageGenerator(): string {
    return this.errorMessage;
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 300, // 300 requests per minute
      },
      {
        name: 'medium',
        ttl: 300000, // 5 minutes
        limit: 500, // 500 requests per 5 minutes
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class ThrottleModule {}
