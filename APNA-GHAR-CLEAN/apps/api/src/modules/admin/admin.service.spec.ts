import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AdminService } from './admin.service';
import { User } from '../users/schemas/user.schema';
import { Property } from '../properties/schemas/property.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { Payment } from '../payments/schemas/payment.schema';
import { TrustPassport } from '../trust/schemas/trust-passport.schema';
import { Review } from '../reviews/schemas/review.schema';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from '../reviews/reviews.service';
import {
  VerificationType,
  VerificationStatus,
} from '@apna-ghar/shared-types';

describe('AdminService', () => {
  let service: AdminService;

  const mockPropertyId = new Types.ObjectId().toString();

  const mockUserModel = {
    countDocuments: jest.fn(),
  };

  const mockPropertyModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
  };

  const mockBookingModel = {
    countDocuments: jest.fn(),
  };

  const mockPaymentModel = {
    aggregate: jest.fn(),
  };

  const mockTrustPassportModel = {
    countDocuments: jest.fn(),
  };

  const mockReviewModel = {
    countDocuments: jest.fn(),
  };

  const mockTrustService = {
    getPassportByPropertyId: jest.fn(),
    verifyCheckpoint: jest.fn(),
  };

  const mockReviewsService = {
    getAllReviews: jest.fn(),
    moderateReview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
        {
          provide: getModelToken(TrustPassport.name),
          useValue: mockTrustPassportModel,
        },
        {
          provide: getModelToken(Review.name),
          useValue: mockReviewModel,
        },
        {
          provide: TrustService,
          useValue: mockTrustService,
        },
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should aggregate platform metrics correctly', async () => {
      mockUserModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(100) }) // totalUsers
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(80) }) // totalStudents
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(20) }); // totalOwners

      mockPropertyModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(15),
      });
      mockBookingModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(45),
      });
      mockReviewModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(3),
      });
      mockTrustPassportModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });
      mockPaymentModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ totalVolume: 450000 }]),
      });

      const overview = await service.getOverview();

      expect(overview.totalUsers).toBe(100);
      expect(overview.totalStudents).toBe(80);
      expect(overview.totalOwners).toBe(20);
      expect(overview.totalProperties).toBe(15);
      expect(overview.activeBookings).toBe(45);
      expect(overview.grossTransactionVolume).toBe(450000);
      expect(overview.pendingTrustAudits).toBe(2);
      expect(overview.pendingReviews).toBe(3);
    });
  });

  describe('getTrustAudits', () => {
    it('should return properties with their audit checkpoints', async () => {
      const mockProp = {
        _id: new Types.ObjectId(mockPropertyId),
        name: 'Stanza Living North Campus',
        slug: 'stanza-north',
        address: { city: 'Delhi' },
        ownerId: {
          name: 'Sunil Verma',
          email: 'sunil@example.com',
          phone: '+919876543210',
        },
      };

      mockPropertyModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockProp]),
          }),
        }),
      });

      mockTrustService.getPassportByPropertyId.mockResolvedValue({
        _id: new Types.ObjectId(),
        isFullyVerified: false,
        score: 5,
        lastVerifiedAt: new Date(),
        checkpoints: [
          {
            type: VerificationType.OWNER_IDENTITY,
            status: VerificationStatus.VERIFIED,
            notes: 'KYC verified',
          },
          {
            type: VerificationType.PHOTOS,
            status: VerificationStatus.PENDING,
            notes: 'Pending audit',
          },
        ],
      });

      const result = await service.getTrustAudits();

      expect(result).toHaveLength(1);
      expect(result[0]!.propertyName).toBe('Stanza Living North Campus');
      expect(result[0]!.ownerName).toBe('Sunil Verma');
      expect(result[0]!.verifiedCheckpoints).toBe(1);
      expect(result[0]!.totalCheckpoints).toBe(2);
    });
  });

  describe('verifyTrustCheckpoint', () => {
    it('should delegate checkpoint audit to TrustService', async () => {
      mockTrustService.verifyCheckpoint.mockResolvedValue({ isFullyVerified: true });

      const dto = {
        type: VerificationType.OWNER_IDENTITY,
        status: VerificationStatus.VERIFIED,
        notes: 'Aadhaar matched',
      };

      const result = await service.verifyTrustCheckpoint(mockPropertyId, dto, 'admin-id');
      expect(mockTrustService.verifyCheckpoint).toHaveBeenCalledWith(
        mockPropertyId,
        dto,
        'admin-id',
      );
      expect(result.isFullyVerified).toBe(true);
    });
  });
});
