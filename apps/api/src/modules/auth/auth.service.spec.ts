import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import {
  UserRole,
  UserStatus,
  AccountStatus,
  RoleApprovalStatus,
  OtpPurpose,
  SessionRevocationReason,
} from '@apna-ghar/shared-types';
import { ERROR_CODES } from '@apna-ghar/shared-constants';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let mockEmailService: Partial<Record<keyof EmailService, jest.Mock>>;
  let mockOtpService: Partial<Record<keyof OtpService, jest.Mock>>;
  let mockSessionService: Partial<Record<keyof SessionService, jest.Mock>>;

  const mockUser = {
    _id: '651a1a2b3c4d5e6f7a8b9c0f',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+919876543210',
    passwordHash: '',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    accountStatus: AccountStatus.ACTIVE,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    phoneVerified: false,
    roleApprovalStatus: RoleApprovalStatus.APPROVED,
    toJSON: () => ({
      id: '651a1a2b3c4d5e6f7a8b9c0f',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+919876543210',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      accountStatus: AccountStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: false,
      roleApprovalStatus: RoleApprovalStatus.APPROVED,
    }),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await argon2.hash('SecurePassword123', { type: argon2.argon2id });
  });

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      markEmailVerified: jest.fn(),
      updateRefreshToken: jest.fn().mockResolvedValue(undefined),
      setResetPasswordToken: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      findActivePasswordResetCandidates: jest.fn().mockResolvedValue([]),
    };

    mockEmailService = {
      sendVerificationOtp: jest.fn().mockResolvedValue({ success: true, simulated: true }),
      sendVerificationSuccess: jest.fn().mockResolvedValue({ success: true, simulated: true }),
      sendPasswordResetOtp: jest.fn().mockResolvedValue({ success: true, simulated: true }),
      sendPasswordResetConfirmation: jest.fn().mockResolvedValue({ success: true, simulated: true }),
    };

    mockOtpService = {
      generateOtp: jest.fn().mockResolvedValue({ otp: '123456', expiresInMinutes: 5 }),
      verifyOtp: jest.fn().mockResolvedValue(true),
      issueResetChallenge: jest.fn().mockResolvedValue('mock_challenge_token_32_bytes_hex'),
      consumeResetChallenge: jest.fn().mockResolvedValue('rahul.sharma@example.com'),
    };

    mockSessionService = {
      createSession: jest.fn().mockResolvedValue({}),
      revokeSession: jest.fn().mockResolvedValue(undefined),
      revokeAllUserSessions: jest.fn().mockResolvedValue(2),
      validateAndTouchSession: jest.fn().mockResolvedValue(true),
      getUserPresenceStatus: jest.fn().mockResolvedValue('ACTIVE'),
      countActiveSessions: jest.fn().mockResolvedValue(1),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'jwtAccessSecret') return 'test_access_secret_super_secure_key_123';
        if (key === 'jwtRefreshSecret') return 'test_refresh_secret_super_secure_key_123';
        if (key === 'jwtAccessExpiry') return '15m';
        if (key === 'jwtRefreshExpiry') return '7d';
        return null;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('Registration & Email OTP Initiation', () => {
    it('should register a new student with pending verification and dispatch OTP', async () => {
      mockUsersService.create!.mockResolvedValue({
        ...mockUser,
        accountStatus: AccountStatus.PENDING_VERIFICATION,
        emailVerified: false,
      });

      const result = await authService.register({
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+919876543210',
        password: 'SecurePassword123',
        role: UserRole.STUDENT,
      });

      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe('rahul.sharma@example.com');
      expect(mockOtpService.generateOtp).toHaveBeenCalledWith('rahul.sharma@example.com', OtpPurpose.EMAIL_VERIFICATION);
      expect(mockEmailService.sendVerificationOtp).toHaveBeenCalledWith(
        'rahul.sharma@example.com',
        'Rahul Sharma',
        '123456',
        5,
      );
    });

    it('should reject admin registration from public signup', async () => {
      await expect(
        authService.register({
          name: 'Hacker Admin',
          email: 'admin@hacker.io',
          phone: '+919876543210',
          password: 'SecurePassword123',
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate email registration', async () => {
      mockUsersService.create!.mockRejectedValue(
        new ConflictException({
          code: ERROR_CODES.AUTH_EMAIL_EXISTS,
          message: 'An account with this email address already exists.',
        }),
      );

      await expect(
        authService.register({
          name: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          phone: '+919876543210',
          password: 'SecurePassword123',
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Email OTP Verification', () => {
    it('should verify OTP, activate user, send welcome email, and establish session', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);
      mockUsersService.markEmailVerified!.mockResolvedValue(mockUser);

      const result = await authService.verifyEmailOtp({
        email: 'rahul.sharma@example.com',
        otp: '123456',
      });

      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith('rahul.sharma@example.com', '123456', OtpPurpose.EMAIL_VERIFICATION);
      expect(mockUsersService.markEmailVerified).toHaveBeenCalledWith(mockUser._id);
      expect(mockEmailService.sendVerificationSuccess).toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('Authentication & Login Controls', () => {
    it('should authenticate active verified user and create session', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'rahul.sharma@example.com',
        password: 'SecurePassword123',
      });

      expect(result.user.email).toBe('rahul.sharma@example.com');
      expect(result.accessToken).toBeDefined();
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('should block login if email is not verified', async () => {
      mockUsersService.findByEmail!.mockResolvedValue({
        ...mockUser,
        accountStatus: AccountStatus.PENDING_VERIFICATION,
        emailVerified: false,
      });

      await expect(
        authService.login({
          email: 'rahul.sharma@example.com',
          password: 'SecurePassword123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should block login if account is suspended', async () => {
      mockUsersService.findByEmail!.mockResolvedValue({
        ...mockUser,
        accountStatus: AccountStatus.SUSPENDED,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        authService.login({
          email: 'rahul.sharma@example.com',
          password: 'SecurePassword123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject invalid password', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'rahul.sharma@example.com',
          password: 'WrongPassword999',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Logout & Session Invalidation', () => {
    it('should revoke session on logout', async () => {
      await authService.logout('651a1a2b3c4d5e6f7a8b9c0f', 'raw_token_xyz');
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        '651a1a2b3c4d5e6f7a8b9c0f',
        'raw_token_xyz',
        SessionRevocationReason.LOGOUT,
      );
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith('651a1a2b3c4d5e6f7a8b9c0f', null);
    });
  });

  describe('Password Recovery Workflow', () => {
    it('should return generic success for forgot password and send OTP if user exists', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);

      const result = await authService.forgotPassword('rahul.sharma@example.com');
      expect(result.success).toBe(true);
      expect(mockOtpService.generateOtp).toHaveBeenCalledWith('rahul.sharma@example.com', OtpPurpose.PASSWORD_RESET);
      expect(mockEmailService.sendPasswordResetOtp).toHaveBeenCalled();
    });

    it('should verify reset OTP and issue challenge token', async () => {
      const result = await authService.verifyResetOtp({
        email: 'rahul.sharma@example.com',
        otp: '654321',
      });

      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith('rahul.sharma@example.com', '654321', OtpPurpose.PASSWORD_RESET);
      expect(mockOtpService.issueResetChallenge).toHaveBeenCalledWith('rahul.sharma@example.com');
      expect(result.challengeToken).toBe('mock_challenge_token_32_bytes_hex');
    });

    it('should reset password with challenge token and revoke all user sessions', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);

      const result = await authService.resetPassword({
        token: 'mock_challenge_token_32_bytes_hex',
        newPassword: 'BrandNewSecurePassword123!',
      });

      expect(result.success).toBe(true);
      expect(mockOtpService.consumeResetChallenge).toHaveBeenCalledWith('mock_challenge_token_32_bytes_hex');
      expect(mockUsersService.resetPassword).toHaveBeenCalled();
      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        mockUser._id,
        SessionRevocationReason.PASSWORD_RESET,
      );
      expect(mockEmailService.sendPasswordResetConfirmation).toHaveBeenCalled();
    });
  });
});
