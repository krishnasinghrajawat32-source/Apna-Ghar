import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UserRole, UserStatus } from '@apnaghar/shared-types';

describe('AuthService — Unit & RBAC Isolation Tests', () => {
  let authService: AuthService;
  let prismaMock: any;
  let redisMock: any;
  let jwtMock: any;

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    passwordHash: '',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    emailVerified: false,
  };

  beforeAll(async () => {
    // Generate valid hash for mock
    mockUser.passwordHash = await bcrypt.hash('SecurePass123!', 10);
  });

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: {
        create: jest.fn(),
      },
      ownerProfile: {
        create: jest.fn(),
      },
      foodPartnerProfile: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mock.jwt.access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: JwtService, useValue: jwtMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt.accessSecret') return 'test_access_secret';
              if (key === 'jwt.accessExpiration') return '15m';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('Registration & Password Hashing', () => {
    it('should register a new student and securely hash the password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockImplementation((args: any) => ({
        ...mockUser,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
      }));

      const result = await authService.register({
        email: 'newstudent@example.com',
        password: 'PlainTextPassword123!',
        role: UserRole.STUDENT,
        firstName: 'Rohit',
        lastName: 'Verma',
      });

      expect(result.user.email).toBe('newstudent@example.com');
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.accessToken).toBe('mock.jwt.access_token');
      expect(result.refreshToken).toBeDefined();

      // Verify that the password was hashed with bcrypt (never stored plaintext)
      const passedData = prismaMock.user.create.mock.calls[0][0].data;
      expect(passedData.passwordHash).not.toBe('PlainTextPassword123!');
      const matches = await bcrypt.compare('PlainTextPassword123!', passedData.passwordHash);
      expect(matches).toBe(true);

      // Verify profile creation inside transaction
      expect(prismaMock.studentProfile.create).toHaveBeenCalled();
      expect(redisMock.set).toHaveBeenCalled();
    });

    it('should reject registration if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'student@example.com',
          password: 'Password123!',
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Authentication & Login', () => {
    it('should successfully login with correct credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'student@example.com',
        password: 'SecurePass123!',
      });

      expect(result.user.id).toBe(mockUser.id);
      expect(result.accessToken).toBe('mock.jwt.access_token');
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('should reject login with wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'student@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for suspended account', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        authService.login({
          email: 'student@example.com',
          password: 'SecurePass123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Logout & Session Invalidation', () => {
    it('should delete the refresh token from Redis upon logout', async () => {
      redisMock.del.mockResolvedValue(1);

      const result = await authService.logout(mockUser.id, 'sample-refresh-token');

      expect(result.loggedOut).toBe(true);
      expect(redisMock.del).toHaveBeenCalledWith('session:refresh:sample-refresh-token');
      expect(redisMock.del).toHaveBeenCalledWith(`user:sessions:${mockUser.id}`);
    });
  });
});
