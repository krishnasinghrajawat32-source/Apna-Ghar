import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ERROR_CODES } from '@apna-ghar/shared-constants';
import { UserRole } from '@apna-ghar/shared-types';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Authentication token missing or invalid.',
      });
    }

    try {
      const secret = this.configService.get<string>('jwtAccessSecret') || 'dev_jwt_access_secret_min_32_characters_seed';
      const decoded = jwt.verify(token, secret) as JwtPayload;

      request.user = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      return true;
    } catch (err: unknown) {
      const isExpired = err instanceof jwt.TokenExpiredError;
      throw new UnauthorizedException({
        code: isExpired ? ERROR_CODES.AUTH_SESSION_EXPIRED : ERROR_CODES.AUTH_UNAUTHORIZED,
        message: isExpired ? 'Session expired. Please refresh your token.' : 'Invalid authentication token.',
      });
    }
  }

  private extractToken(request: { headers: Record<string, string | undefined>; cookies?: Record<string, string> }): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (request.cookies && request.cookies['accessToken']) {
      return request.cookies['accessToken'];
    }

    return null;
  }
}
