import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RoomType } from './schemas/room-type.schema';
import { Room } from './schemas/room.schema';
import { Bed } from './schemas/bed.schema';
import { RedisService } from '../../redis/redis.service';
import { BedStatus } from '@apna-ghar/shared-types';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockPropertyId = new Types.ObjectId();
  const mockRoomTypeId = new Types.ObjectId();
  const mockRoomId = new Types.ObjectId();
  const mockBedId = new Types.ObjectId();
  const mockStudentId = 'student-uuid-123';
  const mockOtherStudentId = 'student-uuid-999';

  const mockBedDoc = {
    _id: mockBedId,
    propertyId: mockPropertyId,
    roomId: mockRoomId,
    roomTypeId: mockRoomTypeId,
    bedLabel: 'Bed 101-A',
    permanentStatus: BedStatus.AVAILABLE,
    toJSON: () => ({
      id: mockBedId.toString(),
      propertyId: mockPropertyId.toString(),
      roomId: mockRoomId.toString(),
      roomTypeId: mockRoomTypeId.toString(),
      bedLabel: 'Bed 101-A',
      permanentStatus: BedStatus.AVAILABLE,
    }),
  };

  const mockBedModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockRoomModel = {
    find: jest.fn(),
  };

  const mockRoomTypeModel = {
    find: jest.fn(),
  };

  const mockRedisClient = {
    ttl: jest.fn().mockResolvedValue(450),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    setNxEx: jest.fn(),
    del: jest.fn(),
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getModelToken(RoomType.name),
          useValue: mockRoomTypeModel,
        },
        {
          provide: getModelToken(Room.name),
          useValue: mockRoomModel,
        },
        {
          provide: getModelToken(Bed.name),
          useValue: mockBedModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('holdBed', () => {
    it('should throw BadRequestException if bed ID is not a valid ObjectId', async () => {
      await expect(service.holdBed('invalid-id', mockStudentId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if bed does not exist', async () => {
      mockBedModel.findById.mockResolvedValue(null);
      await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if bed is not AVAILABLE', async () => {
      mockBedModel.findById.mockResolvedValue({
        ...mockBedDoc,
        permanentStatus: BedStatus.OCCUPIED,
      });

      await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return existing hold if current student already holds the bed', async () => {
      mockBedModel.findById.mockResolvedValue(mockBedDoc);
      mockRedisService.get.mockImplementation(async (key: string) => {
        if (key === `booking:hold:${mockBedId.toString()}`) {
          return JSON.stringify({
            holdId: 'existing-hold-id',
            studentId: mockStudentId,
            bedId: mockBedId.toString(),
            expiresAt: new Date(Date.now() + 450000).toISOString(),
          });
        }
        return null;
      });

      const result = await service.holdBed(mockBedId.toString(), mockStudentId);
      expect(result.holdId).toBe('existing-hold-id');
      expect(result.bedId).toBe(mockBedId.toString());
      expect(result.ttlSecondsRemaining).toBe(450);
    });

    it('should throw ConflictException if another student holds the bed', async () => {
      mockBedModel.findById.mockResolvedValue(mockBedDoc);
      mockRedisService.get.mockImplementation(async (key: string) => {
        if (key === `booking:hold:${mockBedId.toString()}`) {
          return JSON.stringify({
            holdId: 'other-hold-id',
            studentId: mockOtherStudentId,
            bedId: mockBedId.toString(),
            expiresAt: new Date(Date.now() + 450000).toISOString(),
          });
        }
        return null;
      });

      await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should successfully acquire hold with SET NX EX and release previous held bed', async () => {
      mockBedModel.findById.mockResolvedValue(mockBedDoc);
      const previousBedId = new Types.ObjectId().toString();

      mockRedisService.get.mockImplementation(async (key: string) => {
        if (key === `booking:user_hold:${mockStudentId}`) {
          return previousBedId;
        }
        return null; // Not currently held in booking:hold
      });
      mockRedisService.setNxEx.mockResolvedValue(true);
      mockRedisService.set.mockResolvedValue('OK');
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.holdBed(mockBedId.toString(), mockStudentId, 480);

      expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${previousBedId}`);
      expect(mockRedisService.del).toHaveBeenCalledWith(`booking:user_hold:${mockStudentId}`);
      expect(mockRedisService.setNxEx).toHaveBeenCalledWith(
        `booking:hold:${mockBedId.toString()}`,
        expect.any(String),
        480,
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `booking:user_hold:${mockStudentId}`,
        mockBedId.toString(),
        480,
      );
      expect(result.bedId).toBe(mockBedId.toString());
      expect(result.ttlSecondsRemaining).toBe(480);
      expect(result.holdId).toBeDefined();
    });

    it('should throw ConflictException if atomic SET NX EX fails due to race condition', async () => {
      mockBedModel.findById.mockResolvedValue(mockBedDoc);
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.setNxEx.mockResolvedValue(false); // another worker acquired at exact same millisecond

      await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('releaseHold', () => {
    it('should return success if hold already expired', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.releaseHold(mockBedId.toString(), mockStudentId);
      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException if another student attempts to release hold', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          holdId: 'hold-123',
          studentId: mockOtherStudentId,
          bedId: mockBedId.toString(),
        }),
      );

      await expect(service.releaseHold(mockBedId.toString(), mockStudentId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should successfully delete keys when holding student releases hold', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          holdId: 'hold-123',
          studentId: mockStudentId,
          bedId: mockBedId.toString(),
        }),
      );
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.releaseHold(mockBedId.toString(), mockStudentId);
      expect(result.success).toBe(true);
      expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`);
      expect(mockRedisService.del).toHaveBeenCalledWith(`booking:user_hold:${mockStudentId}`);
    });
  });

  describe('getBedHoldStatus', () => {
    it('should return isHeld: false when key does not exist', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getBedHoldStatus(mockBedId.toString());
      expect(result.isHeld).toBe(false);
      expect(result.heldByCurrentStudent).toBe(false);
      expect(result.ttlRemaining).toBe(0);
    });

    it('should return isHeld: true and heldByCurrentStudent: true if student matches', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          holdId: 'hold-123',
          studentId: mockStudentId,
          bedId: mockBedId.toString(),
          expiresAt: '2026-10-18T22:30:00.000Z',
        }),
      );
      mockRedisClient.ttl.mockResolvedValue(300);

      const result = await service.getBedHoldStatus(mockBedId.toString(), mockStudentId);
      expect(result.isHeld).toBe(true);
      expect(result.heldByCurrentStudent).toBe(true);
      expect(result.ttlRemaining).toBe(300);
      expect(result.expiresAt).toBe('2026-10-18T22:30:00.000Z');
    });
  });
});
