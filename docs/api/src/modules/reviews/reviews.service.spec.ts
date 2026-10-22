import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from './schemas/review.schema';
import { Property } from '../properties/schemas/property.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { BookingStatus, ReviewStatus } from '@apna-ghar/shared-types';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockPropertyId = new Types.ObjectId().toString();
  const mockBookingId = new Types.ObjectId().toString();
  const mockReviewId = new Types.ObjectId().toString();

  const mockBookingDoc = {
    _id: new Types.ObjectId(mockBookingId),
    studentId: new Types.ObjectId(mockStudentId),
    propertyId: new Types.ObjectId(mockPropertyId),
    status: BookingStatus.CONFIRMED,
  };

  const mockReviewDoc = {
    _id: new Types.ObjectId(mockReviewId),
    propertyId: new Types.ObjectId(mockPropertyId),
    studentId: { _id: new Types.ObjectId(mockStudentId), name: 'Rahul Sharma' },
    bookingId: new Types.ObjectId(mockBookingId),
    rating: 5,
    cleanlinessRating: 4,
    foodRating: 5,
    safetyRating: 5,
    comment: 'Great hostel with clean rooms and high security.',
    verifiedStay: true,
    status: ReviewStatus.APPROVED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReviewModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockPropertyModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockBookingModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getModelToken(Review.name),
          useValue: mockReviewModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    const validDto = {
      propertyId: mockPropertyId,
      bookingId: mockBookingId,
      rating: 5,
      cleanlinessRating: 4,
      foodRating: 5,
      safetyRating: 5,
      comment: 'Super peaceful environment for studies.',
    };

    it('should throw BadRequestException if student ID is invalid', async () => {
      await expect(service.createReview('invalid-id', validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if student has no confirmed booking (Lock 3)', async () => {
      mockBookingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.createReview(mockStudentId, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if student already reviewed this booking', async () => {
      mockBookingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingDoc),
      });
      mockReviewModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReviewDoc),
      });

      await expect(service.createReview(mockStudentId, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create verified review, recalculate property rating and return review', async () => {
      mockBookingModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBookingDoc),
      });
      mockReviewModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockReviewModel.create.mockResolvedValue(mockReviewDoc);
      mockReviewModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ rating: 5 }]),
        }),
      });
      mockPropertyModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });
      mockReviewModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockReviewDoc),
          }),
        }),
      });

      const result = await service.createReview(mockStudentId, validDto);

      expect(mockReviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
          verifiedStay: true,
          status: ReviewStatus.APPROVED,
        }),
      );
      expect(result.rating).toBe(5);
      expect(result.verifiedStay).toBe(true);
      expect(result.studentName).toBe('Rahul Sharma');
    });
  });

  describe('getPropertyReviews', () => {
    it('should calculate breakdown and return approved reviews', async () => {
      mockReviewModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockReviewDoc]),
          }),
        }),
      });

      const result = await service.getPropertyReviews(mockPropertyId);

      expect(result.breakdown.totalReviews).toBe(1);
      expect(result.breakdown.averageOverall).toBe(5);
      expect(result.breakdown.averageCleanliness).toBe(4);
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0]!.studentName).toBe('Rahul Sharma');
    });

    it('should return 0 breakdown when no reviews exist', async () => {
      mockReviewModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getPropertyReviews(mockPropertyId);

      expect(result.breakdown.totalReviews).toBe(0);
      expect(result.breakdown.averageOverall).toBe(0);
      expect(result.reviews).toHaveLength(0);
    });
  });

  describe('moderateReview', () => {
    it('should update review status and recalculate property rating', async () => {
      mockReviewModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              ...mockReviewDoc,
              status: ReviewStatus.REJECTED,
              propertyId: new Types.ObjectId(mockPropertyId),
            }),
          }),
        }),
      });
      mockReviewModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });
      mockPropertyModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      const result = await service.moderateReview(mockReviewId, {
        status: ReviewStatus.REJECTED,
        moderationNote: 'Violates content policy',
      });

      expect(result.status).toBe(ReviewStatus.REJECTED);
      expect(mockPropertyModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review does not exist', async () => {
      mockReviewModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        service.moderateReview(mockReviewId, { status: ReviewStatus.REJECTED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
