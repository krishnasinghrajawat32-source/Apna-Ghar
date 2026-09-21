import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '@apnaghar/shared-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The token references an account that no longer exists.',
        },
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: `Your account is currently ${user.status.toLowerCase()}. Please contact support.`,
        },
      });
    }

    return user as unknown as AuthenticatedUser;
  }
}
