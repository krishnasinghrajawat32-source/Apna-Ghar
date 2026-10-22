import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '@apna-ghar/shared-types';
import { ERROR_CODES } from '@apna-ghar/shared-constants';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Partial<Record<keyof UsersService, jest.Mock>>;

  const mockUser = {
    _id: '651a1a2b3c4d5e6f7a8b9c0f',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+919876543210',
    passwordHash: '',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    emailVerified: false,
    phoneVerified: false,
    toJSON: () => ({
      id: '651a1a2b3c4d5e6f7a8b9c0f',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+919876543210',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
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
      updateRefreshToken: jest.fn().mockResolvedValue(undefined),
      setResetPasswordToken: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      findActivePasswordResetCandidates: jest.fn().mockResolvedValue([]),
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
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('Registration', () => {
    it('should register a new student and return user and tokens', async () => {
      mockUsersService.create!.mockResolvedValue(mockUser);

      const result = await authService.register({
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+919876543210',
        password: 'SecurePassword123',
        role: UserRole.STUDENT,
      });

      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result.user.email).toBe('rahul.sharma@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalled();
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

  describe('Login', () => {
    it('should authenticate user with valid credentials', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'rahul.sharma@example.com',
        password: 'SecurePassword123',
      });

      expect(result.user.email).toBe('rahul.sharma@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'rahul.sharma@example.com',
          password: 'WrongPassword999',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login when user does not exist', async () => {
      mockUsersService.findByEmail!.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Logout', () => {
    it('should clear refresh token on logout', async () => {
      await authService.logout('651a1a2b3c4d5e6f7a8b9c0f');
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        '651a1a2b3c4d5e6f7a8b9c0f',
        null,
      );
    });
  });
});
