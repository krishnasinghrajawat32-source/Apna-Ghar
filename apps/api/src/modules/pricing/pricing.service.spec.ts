import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PricingService } from './pricing.service';
import { PropertyCost } from './schemas/property-cost.schema';
import { Property } from '../properties/schemas/property.schema';
import { RoomType } from '../inventory/schemas/room-type.schema';
import { CostCategory } from '@apna-ghar/shared-types';

describe('PricingService', () => {
  let service: PricingService;

  const mockPropertyId = new Types.ObjectId();
  const mockRoomTypeId = new Types.ObjectId();

  const mockProperty = {
    _id: mockPropertyId,
    name: 'Greenwood Student Residency',
  };

  const mockCostDoc = {
    _id: new Types.ObjectId(),
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
        category: CostCategory.FIXED,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getModelToken(PropertyCost.name),
          useValue: mockPropertyCostModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: getModelToken(RoomType.name),
          useValue: mockRoomTypeModel,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
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

      const result = await service.getCostBreakdown(
        mockPropertyId.toString(),
        mockRoomTypeId.toString(),
      );

      expect(result).toBeDefined();
      expect(result.upfrontMoveInTotal).toBe(17000); // 8500 deposit + 8500 rent
      expect(result.totalLivingCost.estimatedMonthlyTotal).toBe(9600);
      expect(result.totalLivingCost.rent).toBe(8500);
    });
  });
});
