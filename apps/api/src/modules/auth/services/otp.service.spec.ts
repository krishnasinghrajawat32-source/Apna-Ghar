import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpRecord, PasswordResetChallenge } from '@apna-ghar/database';
import { OtpPurpose } from '@apna-ghar/shared-types';

describe('OtpService', () => {
  let service: OtpService;

  const mockOtpModel = {
    countDocuments: jest.fn(),
    findOne: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  };

  const mockChallengeModel = {
    updateMany: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'otpSecret') return 'test_otp_secret_key_32_bytes_seed';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getModelToken(OtpRecord.name),
          useValue: mockOtpModel,
        },
        {
          provide: getModelToken(PasswordResetChallenge.name),
          useValue: mockChallengeModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit numeric OTP and record hash', async () => {
      mockOtpModel.countDocuments.mockResolvedValue(1); // 1 request this hour
      mockOtpModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null), // no cooldown active
        }),
      });
      mockOtpModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
      mockOtpModel.create.mockResolvedValue({});

      const result = await service.generateOtp('test@student.edu', OtpPurpose.EMAIL_VERIFICATION);

      expect(result.otp).toHaveLength(6);
      expect(/^\d{6}$/.test(result.otp)).toBe(true);
      expect(result.expiresInMinutes).toBe(5);
      expect(mockOtpModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@student.edu',
          purpose: OtpPurpose.EMAIL_VERIFICATION,
          maxAttempts: 5,
        }),
      );
    });

    it('should enforce 60-second cooldown between resends', async () => {
      mockOtpModel.countDocuments.mockResolvedValue(1);
      const activeCooldownDate = new Date(Date.now() + 45 * 1000); // 45s remaining

      mockOtpModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            resendCooldownUntil: activeCooldownDate,
          }),
        }),
      });

      await expect(
        service.generateOtp('test@student.edu', OtpPurpose.EMAIL_VERIFICATION),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce max 5 requests per hour rate limit', async () => {
      mockOtpModel.countDocuments.mockResolvedValue(5); // hourly limit reached

      await expect(
        service.generateOtp('test@student.edu', OtpPurpose.EMAIL_VERIFICATION),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should reject invalid code and increment attempt counter', async () => {
      const mockRecord = {
        attempts: 2,
        maxAttempts: 5,
        otpHash: 'wrong_hash_123',
        isUsed: false,
        save: jest.fn().mockResolvedValue(true),
      };

      mockOtpModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockRecord),
          }),
        }),
      });

      await expect(
        service.verifyOtp('test@student.edu', '000000', OtpPurpose.EMAIL_VERIFICATION),
      ).rejects.toThrow(BadRequestException);

      expect(mockRecord.attempts).toBe(3);
      expect(mockRecord.save).toHaveBeenCalled();
    });

    it('should invalidate OTP once max attempts (5) are reached', async () => {
      const mockRecord = {
        attempts: 5,
        maxAttempts: 5,
        otpHash: 'some_hash',
        isUsed: false,
        save: jest.fn().mockResolvedValue(true),
      };

      mockOtpModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockRecord),
          }),
        }),
      });

      await expect(
        service.verifyOtp('test@student.edu', '123456', OtpPurpose.EMAIL_VERIFICATION),
      ).rejects.toThrow(BadRequestException);

      expect(mockRecord.isUsed).toBe(true);
    });
  });
});
