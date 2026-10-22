"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trust_service_1 = require("./trust.service");
const trust_passport_schema_1 = require("./schemas/trust-passport.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('TrustService', () => {
    let service;
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockTrustPassport = {
        _id: new mongoose_2.Types.ObjectId(),
        propertyId: mockPropertyId,
        isFullyVerified: false,
        score: 0,
        checkpoints: [
            {
                type: shared_types_1.VerificationType.OWNER_IDENTITY,
                status: shared_types_1.VerificationStatus.PENDING,
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                trust_service_1.TrustService,
                {
                    provide: (0, mongoose_1.getModelToken)(trust_passport_schema_1.TrustPassport.name),
                    useValue: mockTrustPassportModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
            ],
        }).compile();
        service = module.get(trust_service_1.TrustService);
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
                checkpoints: new Array(7).fill({ status: shared_types_1.VerificationStatus.PENDING }),
            });
            const result = await service.getPassportByPropertyId(mockPropertyId.toString());
            expect(mockTrustPassportModel.create).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });
    describe('calculateFreshness', () => {
        it('should return FRESH for timestamps within 24 hours', () => {
            const recent = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            expect(service.calculateFreshness(recent)).toBe(shared_types_1.AvailabilityFreshness.FRESH);
        });
        it('should return NEEDS_CONFIRMATION for timestamps between 24 and 72 hours', () => {
            const intermediate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
            expect(service.calculateFreshness(intermediate)).toBe(shared_types_1.AvailabilityFreshness.NEEDS_CONFIRMATION);
        });
        it('should return STALE for timestamps older than 72 hours or undefined', () => {
            const old = new Date(Date.now() - 96 * 60 * 60 * 1000); // 96 hours ago
            expect(service.calculateFreshness(old)).toBe(shared_types_1.AvailabilityFreshness.STALE);
            expect(service.calculateFreshness(undefined)).toBe(shared_types_1.AvailabilityFreshness.STALE);
        });
    });
});
//# sourceMappingURL=trust.service.spec.js.map