import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SessionService } from './session.service';
import { Session } from '@apna-ghar/database';
import { User } from '../../users/schemas/user.schema';
import { SessionRevocationReason, PresenceStatus } from '@apna-ghar/shared-types';

describe('SessionService', () => {
  let service: SessionService;

  const mockSessionModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    exists: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockUserModel = {
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  describe('createSession', () => {
    it('should create persistent session and update user login timestamp', async () => {
      const userId = new Types.ObjectId().toString();
      mockSessionModel.create.mockResolvedValue({ id: 'session_1' });
      mockUserModel.updateOne.mockResolvedValue({});

      await service.createSession(userId, 'raw_jwt_access_token_123', 'Chrome / Windows', '127.0.0.1');

      expect(mockSessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          tokenHash: expect.any(String),
          userAgent: 'Chrome / Windows',
          ipAddress: '127.0.0.1',
          isRevoked: false,
        }),
      );
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId) },
        expect.objectContaining({
          $set: expect.objectContaining({
            lastLoginAt: expect.any(Date),
            lastActivityAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('revokeSession', () => {
    it('should mark session revoked on logout', async () => {
      const userId = new Types.ObjectId().toString();
      mockSessionModel.updateOne.mockResolvedValue({});
      mockUserModel.updateOne.mockResolvedValue({});

      await service.revokeSession(userId, 'raw_token_xyz', SessionRevocationReason.LOGOUT);

      expect(mockSessionModel.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          isRevoked: false,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({
            isRevoked: true,
            revocationReason: SessionRevocationReason.LOGOUT,
          }),
        }),
      );
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all user sessions on password reset or suspension', async () => {
      const userId = new Types.ObjectId().toString();
      mockSessionModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const count = await service.revokeAllUserSessions(
        userId,
        SessionRevocationReason.ADMIN_SUSPENSION,
      );

      expect(count).toBe(3);
      expect(mockSessionModel.updateMany).toHaveBeenCalledWith(
        {
          userId: expect.any(Types.ObjectId),
          isRevoked: false,
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            isRevoked: true,
            revocationReason: SessionRevocationReason.ADMIN_SUSPENSION,
          }),
        }),
      );
    });
  });

  describe('getUserPresenceStatus', () => {
    it('should return ACTIVE if active session within last 15 minutes', async () => {
      const userId = new Types.ObjectId().toString();
      mockSessionModel.exists.mockResolvedValue(true);

      const status = await service.getUserPresenceStatus(userId);
      expect(status).toBe(PresenceStatus.ACTIVE);
    });

    it('should return INACTIVE if no active session within 15 minutes', async () => {
      const userId = new Types.ObjectId().toString();
      mockSessionModel.exists.mockResolvedValue(false);

      const status = await service.getUserPresenceStatus(userId);
      expect(status).toBe(PresenceStatus.INACTIVE);
    });
  });
});
