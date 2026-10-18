import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TrustService } from './trust.service';
import { TrustPassport } from './schemas/trust-passport.schema';
import { Property } from '../properties/schemas/property.schema';
import {
  VerificationType,
  VerificationStatus,
  AvailabilityFreshness,
} from '@apna-ghar/shared-types';

describe('TrustService', () => {
  let service: TrustService;

  const mockPropertyId = new Types.ObjectId();

  const mockTrustPassport = {
    _id: new Types.ObjectId(),
    propertyId: mockPropertyId,
    isFullyVerified: false,
    score: 0,
    checkpoints: [
      {
        type: VerificationType.OWNER_IDENTITY,
        status: VerificationStatus.PENDING,
        notes: '',
      },
    ],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockTrustPassportModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockPropertyModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: mockPropertyId, isFullyVerified: true }),
    }),
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrustService,
        {
          provide: getModelToken(TrustPassport.name),
          useValue: mockTrustPassportModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
      ],
    }).compile();

    service = module.get<TrustService>(TrustService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPassportByPropertyId', () => {
    it('should return existing passport if found', async () => {
      mockTrustPassportModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTrustPassport),
      });

      const result = await service.getPassportByPropertyId(mockPropertyId.toString());
      expect(result).toBeDefined();
      expect(result.propertyId).toEqual(mockPropertyId);
    });

    it('should create default passport with 7 checkpoints if not found', async () => {
      mockTrustPassportModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockTrustPassportModel.create.mockResolvedValue({
        ...mockTrustPassport,
        checkpoints: new Array(7).fill({ status: VerificationStatus.PENDING }),
      });

      const result = await service.getPassportByPropertyId(mockPropertyId.toString());
      expect(mockTrustPassportModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('calculateFreshness', () => {
    it('should return FRESH for timestamps within 24 hours', () => {
      const recent = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(service.calculateFreshness(recent)).toBe(AvailabilityFreshness.FRESH);
    });

    it('should return NEEDS_CONFIRMATION for timestamps between 24 and 72 hours', () => {
      const intermediate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      expect(service.calculateFreshness(intermediate)).toBe(
        AvailabilityFreshness.NEEDS_CONFIRMATION,
      );
    });

    it('should return STALE for timestamps older than 72 hours or undefined', () => {
      const old = new Date(Date.now() - 96 * 60 * 60 * 1000); // 96 hours ago
      expect(service.calculateFreshness(old)).toBe(AvailabilityFreshness.STALE);
      expect(service.calculateFreshness(undefined)).toBe(AvailabilityFreshness.STALE);
    });
  });
});
