"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const reviews_service_1 = require("./reviews.service");
const review_schema_1 = require("./schemas/review.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('ReviewsService', () => {
    let service;
    const mockStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockPropertyId = new mongoose_2.Types.ObjectId().toString();
    const mockBookingId = new mongoose_2.Types.ObjectId().toString();
    const mockReviewId = new mongoose_2.Types.ObjectId().toString();
    const mockBookingDoc = {
        _id: new mongoose_2.Types.ObjectId(mockBookingId),
        studentId: new mongoose_2.Types.ObjectId(mockStudentId),
        propertyId: new mongoose_2.Types.ObjectId(mockPropertyId),
        status: shared_types_1.BookingStatus.CONFIRMED,
    };
    const mockReviewDoc = {
        _id: new mongoose_2.Types.ObjectId(mockReviewId),
        propertyId: new mongoose_2.Types.ObjectId(mockPropertyId),
        studentId: { _id: new mongoose_2.Types.ObjectId(mockStudentId), name: 'Rahul Sharma' },
        bookingId: new mongoose_2.Types.ObjectId(mockBookingId),
        rating: 5,
        cleanlinessRating: 4,
        foodRating: 5,
        safetyRating: 5,
        comment: 'Great hostel with clean rooms and high security.',
        verifiedStay: true,
        status: shared_types_1.ReviewStatus.APPROVED,
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                reviews_service_1.ReviewsService,
                {
                    provide: (0, mongoose_1.getModelToken)(review_schema_1.Review.name),
                    useValue: mockReviewModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(booking_schema_1.Booking.name),
                    useValue: mockBookingModel,
                },
            ],
        }).compile();
        service = module.get(reviews_service_1.ReviewsService);
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
            await expect(service.createReview('invalid-id', validDto)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException if student has no confirmed booking (Lock 3)', async () => {
            mockBookingModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            await expect(service.createReview(mockStudentId, validDto)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException if student already reviewed this booking', async () => {
            mockBookingModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockBookingDoc),
            });
            mockReviewModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockReviewDoc),
            });
            await expect(service.createReview(mockStudentId, validDto)).rejects.toThrow(common_1.BadRequestException);
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
            expect(mockReviewModel.create).toHaveBeenCalledWith(expect.objectContaining({
                rating: 5,
                verifiedStay: true,
                status: shared_types_1.ReviewStatus.APPROVED,
            }));
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
            expect(result.reviews[0].studentName).toBe('Rahul Sharma');
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
                            status: shared_types_1.ReviewStatus.REJECTED,
                            propertyId: new mongoose_2.Types.ObjectId(mockPropertyId),
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
                status: shared_types_1.ReviewStatus.REJECTED,
                moderationNote: 'Violates content policy',
            });
            expect(result.status).toBe(shared_types_1.ReviewStatus.REJECTED);
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
            await expect(service.moderateReview(mockReviewId, { status: shared_types_1.ReviewStatus.REJECTED })).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=reviews.service.spec.js.map