import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@apna-ghar/shared-types';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
