import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserWithRole } from '../../users/interfaces/user.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const user: UserWithRole = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('User not authenticated');

    const hasRole = requiredRoles.some((r) => user.role?.name === r.toUpperCase());
    if (!hasRole) throw new ForbiddenException(`Required roles: ${requiredRoles.join(', ')}`);
    return true;
  }
}
