import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ERROR_CODES } from '@apna-ghar/shared-constants';
import { UserRole } from '@apna-ghar/shared-types';

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.persistRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await argon2.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email address or password.',
      });
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.persistRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshToken(rawToken: string) {
    if (!rawToken) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Refresh token is required.',
      });
    }

    const refreshSecret =
      this.configService.get<string>('jwtRefreshSecret') || 'dev_jwt_refresh_secret_min_32_characters_seed';

    let payload: { sub: string };
    try {
      payload = jwt.verify(rawToken, refreshSecret) as { sub: string };
    } catch {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_SESSION_EXPIRED,
        message: 'Refresh session expired or invalid. Please log in again.',
      });
    }

    const user = await this.usersService.findById(payload.sub, true);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Session has been invalidated. Please log in again.',
      });
    }

    const isTokenValid = await argon2.verify(user.refreshTokenHash, rawToken);
    if (!isTokenValid) {
      // Possible reuse attack: revoke refresh token
      await this.usersService.updateRefreshToken(user._id, null);
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Session revoked. Please log in again.',
      });
    }

    // Token rotation: Issue fresh access AND refresh token
    const newTokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.persistRefreshToken(user._id.toString(), newTokens.refreshToken);

    return {
      user: user.toJSON(),
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await argon2.hash(resetToken, { type: argon2.argon2id });
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.usersService.setResetPasswordToken(user._id, resetTokenHash, expiresAt);

      // In production, send via email provider. In dev, log token for testing.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info(`[Dev Password Reset] Token for ${email}: ${resetToken}`);
      }
    }

    return {
      message: 'If an account exists with this email address, password reset instructions have been dispatched.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const candidates = await this.usersService.findActivePasswordResetCandidates();

    let matchedUser = null;
    for (const candidate of candidates) {
      if (candidate.resetPasswordTokenHash) {
        const isMatch = await argon2.verify(candidate.resetPasswordTokenHash, dto.token);
        if (isMatch) {
          matchedUser = candidate;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid or expired password reset token.',
      });
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.usersService.resetPassword(matchedUser._id, newPasswordHash);

    return {
      message: 'Password has been successfully reset. You may now log in with your new credentials.',
    };
  }

  private async generateTokens(userId: string, email: string, role: UserRole): Promise<TokenResult> {
    const accessSecret =
      this.configService.get<string>('jwtAccessSecret') || 'dev_jwt_access_secret_min_32_characters_seed';
    const refreshSecret =
      this.configService.get<string>('jwtRefreshSecret') || 'dev_jwt_refresh_secret_min_32_characters_seed';
    const accessExpiry = this.configService.get<string>('jwtAccessExpiry') || '15m';
    const refreshExpiry = this.configService.get<string>('jwtRefreshExpiry') || '7d';

    const accessToken = jwt.sign(
      { sub: userId, email, role },
      accessSecret,
      { expiresIn: accessExpiry as jwt.SignOptions['expiresIn'] },
    );

    const refreshToken = jwt.sign(
      { sub: userId, jti: crypto.randomUUID() },
      refreshSecret,
      { expiresIn: refreshExpiry as jwt.SignOptions['expiresIn'] },
    );

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
    await this.usersService.updateRefreshToken(userId, tokenHash);
  }
}
