import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithRole } from './user.interface.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserWithRole => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
