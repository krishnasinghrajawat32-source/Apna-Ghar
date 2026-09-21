import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@apnaghar/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN_UNAUTHENTICATED',
          message: 'User is not authenticated.',
        },
      });
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN_INSUFFICIENT_ROLE',
          message: `Access denied. Your role is '${user.role}', but this resource requires: ${requiredRoles.join(' or ')}.`,
        },
      });
    }

    return true;
  }
}
