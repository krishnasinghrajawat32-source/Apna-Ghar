"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pricing_service_1 = require("./pricing.service");
const property_cost_schema_1 = require("./schemas/property-cost.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('PricingService', () => {
    let service;
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockRoomTypeId = new mongoose_2.Types.ObjectId();
    const mockProperty = {
        _id: mockPropertyId,
        name: 'Greenwood Student Residency',
    };
    const mockCostDoc = {
        _id: new mongoose_2.Types.ObjectId(),
        propertyId: mockPropertyId,
        roomTypeId: mockRoomTypeId,
        baseRent: 8500,
        securityDeposit: 8500,
        depositRefundable: true,
        noticePeriodDays: 30,
        foodEstimate: 0,
        electricityEstimate: 800,
        maintenance: 300,
        laundry: 0,
        internet: 0,
        commuteEstimate: 0,
        otherRecurring: 0,
        estimatedMonthlyTotal: 9600,
        lineItems: [
            {
                name: 'Room Rent',
                amount: 8500,
                category: shared_types_1.CostCategory.FIXED,
                frequency: 'MONTHLY',
            },
        ],
    };
    const mockPropertyCostModel = {
        findOne: jest.fn(),
        create: jest.fn(),
    };
    const mockPropertyModel = {
        findById: jest.fn(),
        find: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
        }),
    };
    const mockRoomTypeModel = {
        findById: jest.fn(),
        find: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
        }),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                pricing_service_1.PricingService,
                {
                    provide: (0, mongoose_1.getModelToken)(property_cost_schema_1.PropertyCost.name),
                    useValue: mockPropertyCostModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(room_type_schema_1.RoomType.name),
                    useValue: mockRoomTypeModel,
                },
            ],
        }).compile();
        service = module.get(pricing_service_1.PricingService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getCostBreakdown', () => {
        it('should return complete breakdown when cost document exists', async () => {
            mockPropertyModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockProperty),
            });
            mockRoomTypeModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ _id: mockRoomTypeId, name: 'Twin Sharing' }),
            });
            mockPropertyCostModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockCostDoc),
            });
            const result = await service.getCostBreakdown(mockPropertyId.toString(), mockRoomTypeId.toString());
            expect(result).toBeDefined();
            expect(result.upfrontMoveInTotal).toBe(17000); // 8500 deposit + 8500 rent
            expect(result.totalLivingCost.estimatedMonthlyTotal).toBe(9600);
            expect(result.totalLivingCost.rent).toBe(8500);
        });
    });
});
//# sourceMappingURL=pricing.service.spec.js.map