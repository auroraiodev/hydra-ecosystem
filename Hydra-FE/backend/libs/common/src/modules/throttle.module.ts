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
      { name: 'short', ttl: 60000, limit: 300 },
      { name: 'medium', ttl: 300000, limit: 500 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard }],
  exports: [ThrottlerModule],
})
export class ThrottleModule {}
