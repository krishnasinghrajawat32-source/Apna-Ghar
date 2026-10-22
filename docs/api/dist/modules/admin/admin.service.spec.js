"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const admin_service_1 = require("./admin.service");
const user_schema_1 = require("../users/schemas/user.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const trust_passport_schema_1 = require("../trust/schemas/trust-passport.schema");
const review_schema_1 = require("../reviews/schemas/review.schema");
const trust_service_1 = require("../trust/trust.service");
const reviews_service_1 = require("../reviews/reviews.service");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('AdminService', () => {
    let service;
    const mockPropertyId = new mongoose_2.Types.ObjectId().toString();
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                admin_service_1.AdminService,
                {
                    provide: (0, mongoose_1.getModelToken)(user_schema_1.User.name),
                    useValue: mockUserModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(booking_schema_1.Booking.name),
                    useValue: mockBookingModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(payment_schema_1.Payment.name),
                    useValue: mockPaymentModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(trust_passport_schema_1.TrustPassport.name),
                    useValue: mockTrustPassportModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(review_schema_1.Review.name),
                    useValue: mockReviewModel,
                },
                {
                    provide: trust_service_1.TrustService,
                    useValue: mockTrustService,
                },
                {
                    provide: reviews_service_1.ReviewsService,
                    useValue: mockReviewsService,
                },
            ],
        }).compile();
        service = module.get(admin_service_1.AdminService);
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
                _id: new mongoose_2.Types.ObjectId(mockPropertyId),
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
                _id: new mongoose_2.Types.ObjectId(),
                isFullyVerified: false,
                score: 5,
                lastVerifiedAt: new Date(),
                checkpoints: [
                    {
                        type: shared_types_1.VerificationType.OWNER_IDENTITY,
                        status: shared_types_1.VerificationStatus.VERIFIED,
                        notes: 'KYC verified',
                    },
                    {
                        type: shared_types_1.VerificationType.PHOTOS,
                        status: shared_types_1.VerificationStatus.PENDING,
                        notes: 'Pending audit',
                    },
                ],
            });
            const result = await service.getTrustAudits();
            expect(result).toHaveLength(1);
            expect(result[0].propertyName).toBe('Stanza Living North Campus');
            expect(result[0].ownerName).toBe('Sunil Verma');
            expect(result[0].verifiedCheckpoints).toBe(1);
            expect(result[0].totalCheckpoints).toBe(2);
        });
    });
    describe('verifyTrustCheckpoint', () => {
        it('should delegate checkpoint audit to TrustService', async () => {
            mockTrustService.verifyCheckpoint.mockResolvedValue({ isFullyVerified: true });
            const dto = {
                type: shared_types_1.VerificationType.OWNER_IDENTITY,
                status: shared_types_1.VerificationStatus.VERIFIED,
                notes: 'Aadhaar matched',
            };
            const result = await service.verifyTrustCheckpoint(mockPropertyId, dto, 'admin-id');
            expect(mockTrustService.verifyCheckpoint).toHaveBeenCalledWith(mockPropertyId, dto, 'admin-id');
            expect(result.isFullyVerified).toBe(true);
        });
    });
});
//# sourceMappingURL=admin.service.spec.js.map