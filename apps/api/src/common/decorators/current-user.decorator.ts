import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@apna-ghar/shared-types';

export interface AuthenticatedUser {
  userId: string;
  id?: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (data === 'id' || data === 'userId') return user.userId || user.id || user._id;
    if (data) return user[data];
    return user;
  },
);
