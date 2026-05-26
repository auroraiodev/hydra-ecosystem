import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import type { Request } from 'express';

@Injectable()
export class DynamicRateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.get(RATE_LIMIT_KEY, context.getHandler());

    if (!rateLimitConfig) {
      return true; // No rate limit configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // Apply different limits based on user role
    const adjustedLimit = this.adjustLimitForUser(rateLimitConfig, user);

    // Store adjusted limit for the ThrottlerGuard to use
    (request as any).__rateLimitConfig = adjustedLimit;

    return true;
  }

  private adjustLimitForUser(config: any, user: any): any {
    if (!user) {
      return config; // Unauthenticated user gets base limit
    }

    // Apply role-based adjustments
    const roleMultipliers = {
      ADMIN: 5, // 5x more requests
      SELLER: 3, // 3x more requests
      CLIENT: 1, // Standard limit
    };

    const multiplier = roleMultipliers[user.roles?.name] || 1;

    return {
      ...config,
      limit: config.limit * multiplier,
      ttl: config.ttl, // Keep same time window
    };
  }
}
