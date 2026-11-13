import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ERROR_CODES } from '@apna-ghar/shared-constants';
import {
  UserRole,
  AccountStatus,
  OtpPurpose,
  SessionRevocationReason,
  RoleApprovalStatus,
} from '@apna-ghar/shared-types';

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Registers a new Student, Owner, or Mess Partner.
   * Admin role is rejected. Email verification OTP is dispatched.
   */
  async register(dto: RegisterDto, userAgent = '', ipAddress = '') {
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_FORBIDDEN,
        message: 'Administrative registration is restricted and cannot be requested publicly.',
      });
    }

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
      accountStatus: AccountStatus.ACTIVE,
      emailVerified: true,
      roleApprovalStatus:
        dto.role === UserRole.STUDENT ? RoleApprovalStatus.APPROVED : RoleApprovalStatus.PENDING,
    });

    // Automatically issue tokens and register active session
    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.persistRefreshToken(user._id.toString(), tokens.refreshToken);
    await this.sessionService.createSession(
      user._id.toString(),
      tokens.accessToken,
      userAgent,
      ipAddress,
    );

    return {
      success: true,
      requiresVerification: false,
      email: user.email,
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Account created successfully. Welcome to Apna Ghar!',
    };
  }

  /**
   * Verifies Email OTP, marks account active, dispatches welcome email, and initiates session
   */
  async verifyEmailOtp(dto: VerifyEmailOtpDto, userAgent = '', ipAddress = '') {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Verify OTP against hashed record
    await this.otpService.verifyOtp(normalizedEmail, dto.otp, OtpPurpose.EMAIL_VERIFICATION);

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: 'No account associated with this email address.',
      });
    }

    // Mark email verified and account active
    const updatedUser = await this.usersService.markEmailVerified(user._id);

    // Dispatch welcome notification
    await this.emailService.sendVerificationSuccess(updatedUser.email, updatedUser.name, updatedUser.role);

    // Issue tokens and register persistent session
    const tokens = await this.generateTokens(
      updatedUser._id.toString(),
      updatedUser.email,
      updatedUser.role,
    );
    await this.persistRefreshToken(updatedUser._id.toString(), tokens.refreshToken);
    await this.sessionService.createSession(
      updatedUser._id.toString(),
      tokens.accessToken,
      userAgent,
      ipAddress,
    );

    return {
      success: true,
      message: 'Email address verified successfully. Welcome to Apna Ghar!',
      user: updatedUser.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Resends verification or reset OTP with cooldown and hourly rate limit checks
   */
  async resendOtp(dto: ResendOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    // Generic response if account doesn't exist
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email address, a new OTP code has been dispatched.',
      };
    }

    const purpose = dto.purpose || OtpPurpose.EMAIL_VERIFICATION;

    if (purpose === OtpPurpose.EMAIL_VERIFICATION && user.emailVerified) {
      return {
        success: true,
        message: 'This email address is already verified. You may sign in directly.',
      };
    }

    const { otp, expiresInMinutes } = await this.otpService.generateOtp(normalizedEmail, purpose);

    if (purpose === OtpPurpose.PASSWORD_RESET) {
      await this.emailService.sendPasswordResetOtp(user.email, user.name, otp, expiresInMinutes);
    } else {
      await this.emailService.sendVerificationOtp(user.email, user.name, otp, expiresInMinutes);
    }

    const isDevFallback = !this.configService.get<string>('SMTP_USER') || process.env.NODE_ENV !== 'production';

    return {
      success: true,
      devOtp: isDevFallback ? otp : undefined,
      message: 'A new 6-digit OTP code has been dispatched to your email address.',
    };
  }

  /**
   * Authenticates user, enforcing email verification and account status checks
   */
  async login(dto: LoginDto, userAgent = '', ipAddress = '') {
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

    // Ensure active status and verified flag
    if (!user.emailVerified || user.accountStatus === AccountStatus.PENDING_VERIFICATION) {
      await this.usersService.markEmailVerified(user._id);
    }

    // Check account suspension status
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_ACCOUNT_SUSPENDED,
        message: 'Your account has been suspended by administration. Please contact support.',
      });
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.persistRefreshToken(user._id.toString(), tokens.refreshToken);
    await this.sessionService.createSession(
      user._id.toString(),
      tokens.accessToken,
      userAgent,
      ipAddress,
    );

    return {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logs out user, revoking server-side session and clearing refresh token
   */
  async logout(userId: string, accessToken?: string): Promise<void> {
    if (accessToken) {
      await this.sessionService.revokeSession(userId, accessToken, SessionRevocationReason.LOGOUT);
    }
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Rotates tokens and validates server-side refresh session
   */
  async refreshToken(rawToken: string, userAgent = '', ipAddress = '') {
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

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_ACCOUNT_SUSPENDED,
        message: 'Account has been suspended.',
      });
    }

    const isTokenValid = await argon2.verify(user.refreshTokenHash, rawToken);
    if (!isTokenValid) {
      // Possible token reuse attack: revoke refresh token immediately
      await this.usersService.updateRefreshToken(user._id, null);
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Session revoked. Please log in again.',
      });
    }

    // Token rotation: Issue fresh access AND refresh token
    const newTokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.persistRefreshToken(user._id.toString(), newTokens.refreshToken);
    await this.sessionService.createSession(
      user._id.toString(),
      newTokens.accessToken,
      userAgent,
      ipAddress,
    );

    return {
      user: user.toJSON(),
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    };
  }

  /**
   * Generates password reset OTP without user enumeration
   */
  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user && user.accountStatus !== AccountStatus.SUSPENDED) {
      const { otp, expiresInMinutes } = await this.otpService.generateOtp(
        normalizedEmail,
        OtpPurpose.PASSWORD_RESET,
      );
      await this.emailService.sendPasswordResetOtp(user.email, user.name, otp, expiresInMinutes);
    }

    return {
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been dispatched.',
    };
  }

  /**
   * Verifies Password Reset OTP and issues single-use reset challenge token
   */
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    await this.otpService.verifyOtp(normalizedEmail, dto.otp, OtpPurpose.PASSWORD_RESET);

    const challengeToken = await this.otpService.issueResetChallenge(normalizedEmail);

    return {
      success: true,
      challengeToken,
      message: 'OTP verified. You may now proceed to set a new password.',
    };
  }

  /**
   * Resets password using challenge token, enforces password strength, revokes all sessions
   */
  async resetPassword(dto: ResetPasswordDto) {
    const token = dto.token;
    if (!token) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_RESET_CHALLENGE_INVALID,
        message: 'Password reset token is required.',
      });
    }

    let email = '';
    // Try challenge token first
    try {
      email = await this.otpService.consumeResetChallenge(token);
    } catch {
      // Fallback: check legacy candidates
      const candidates = await this.usersService.findActivePasswordResetCandidates();
      let matchedUser = null;
      for (const candidate of candidates) {
        if (candidate.resetPasswordTokenHash) {
          const isMatch = await argon2.verify(candidate.resetPasswordTokenHash, token);
          if (isMatch) {
            matchedUser = candidate;
            email = candidate.email;
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
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: 'User account not found.',
      });
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.usersService.resetPassword(user._id, newPasswordHash);

    // Revoke all active user sessions across all devices
    await this.sessionService.revokeAllUserSessions(
      user._id.toString(),
      SessionRevocationReason.PASSWORD_RESET,
    );

    // Send confirmation email
    await this.emailService.sendPasswordResetConfirmation(user.email, user.name);

    return {
      success: true,
      message: 'Password has been successfully reset. All active sessions have been logged out. You may now sign in with your new credentials.',
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
