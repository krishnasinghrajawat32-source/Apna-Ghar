import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PropertyCost, PropertyCostDocument } from './schemas/property-cost.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { RoomType, RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { CostCategory, CostItem, TotalLivingCost } from '@apna-ghar/shared-types';

export interface CostBreakdownResult {
  propertyId: string;
  roomTypeId?: string;
  roomTypeName?: string;
  upfrontMoveInTotal: number;
  securityDeposit: number;
  depositRefundable: boolean;
  noticePeriodDays: number;
  totalLivingCost: TotalLivingCost;
}

@Injectable()
export class PricingService implements OnModuleInit {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectModel(PropertyCost.name)
    private readonly propertyCostModel: Model<PropertyCostDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(RoomType.name)
    private readonly roomTypeModel: Model<RoomTypeDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const isConnected = !this.propertyCostModel.db || this.propertyCostModel.db.readyState === 1;
    if (isConnected) {
      await this.seedInitialCosts();
    } else {
      this.propertyCostModel.db.once('connected', () => {
        this.seedInitialCosts().catch((err) => {
          this.logger.warn(`Pricing seeding skipped or deferred: ${err.message}`);
        });
      });
    }
  }

  /**
   * Retrieves complete Total Living Cost breakdown for a property and optional room type
   */
  async getCostBreakdown(
    propertyId: string,
    roomTypeId?: string,
  ): Promise<CostBreakdownResult> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new NotFoundException(`Invalid property ID: ${propertyId}`);
    }

    const property = await this.propertyModel.findById(propertyId).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    // Try finding specific cost structure for roomTypeId
    let costDoc: PropertyCostDocument | null = null;
    let roomTypeDoc: RoomTypeDocument | null = null;

    if (roomTypeId && Types.ObjectId.isValid(roomTypeId)) {
      roomTypeDoc = await this.roomTypeModel.findById(roomTypeId).exec();
      costDoc = await this.propertyCostModel.findOne({
        propertyId: new Types.ObjectId(propertyId),
        roomTypeId: new Types.ObjectId(roomTypeId),
      }).exec();
    }

    // Fall back to general property cost structure
    if (!costDoc) {
      costDoc = await this.propertyCostModel.findOne({
        propertyId: new Types.ObjectId(propertyId),
      }).exec();
    }

    // If still no cost document exists, build dynamic calculation from room type or sensible defaults
    if (!costDoc) {
      const baseRent = roomTypeDoc?.baseRent || 8000;
      const deposit = roomTypeDoc?.deposit || baseRent;

      const dynamicLineItems: CostItem[] = [
        {
          name: 'Monthly Room Rent',
          amount: baseRent,
          category: CostCategory.FIXED,
          frequency: 'MONTHLY',
          description: 'Includes accommodation and basic utilities',
        },
        {
          name: 'Estimated Electricity (Sub-metered)',
          amount: 800,
          category: CostCategory.ESTIMATED,
          frequency: 'MONTHLY',
          description: 'Metered per unit consumption',
        },
        {
          name: 'Maintenance & Cleaning',
          amount: 300,
          category: CostCategory.FIXED,
          frequency: 'MONTHLY',
          description: 'Daily housekeeping and waste management',
        },
      ];

      const monthlyTotal = baseRent + 800 + 300;

      return {
        propertyId,
        roomTypeId: roomTypeDoc?._id.toString(),
        roomTypeName: roomTypeDoc?.name || 'Standard Accommodation',
        upfrontMoveInTotal: deposit + baseRent,
        securityDeposit: deposit,
        depositRefundable: true,
        noticePeriodDays: 30,
        totalLivingCost: {
          rent: baseRent,
          foodEstimate: 0,
          electricityEstimate: 800,
          maintenance: 300,
          laundry: 0,
          internet: 0,
          commuteEstimate: 0,
          otherRecurring: 0,
          estimatedMonthlyTotal: monthlyTotal,
          lineItems: dynamicLineItems,
        },
      };
    }

    const upfrontMoveIn = costDoc.securityDeposit + costDoc.baseRent;

    const totalLivingCost: TotalLivingCost = {
      rent: costDoc.baseRent,
      foodEstimate: costDoc.foodEstimate,
      electricityEstimate: costDoc.electricityEstimate,
      maintenance: costDoc.maintenance,
      laundry: costDoc.laundry,
      internet: costDoc.internet,
      commuteEstimate: costDoc.commuteEstimate,
      otherRecurring: costDoc.otherRecurring,
      estimatedMonthlyTotal: costDoc.estimatedMonthlyTotal,
      lineItems: costDoc.lineItems.map((item) => ({
        name: item.name,
        amount: item.amount,
        category: item.category,
        frequency: item.frequency,
        description: item.description,
      })),
    };

    return {
      propertyId,
      roomTypeId: costDoc.roomTypeId ? costDoc.roomTypeId.toString() : roomTypeDoc?._id.toString(),
      roomTypeName: roomTypeDoc?.name,
      upfrontMoveInTotal: upfrontMoveIn,
      securityDeposit: costDoc.securityDeposit,
      depositRefundable: costDoc.depositRefundable,
      noticePeriodDays: costDoc.noticePeriodDays,
      totalLivingCost,
    };
  }

  /**
   * Seeds initial transparent cost structures for seeded properties
   */
  private async seedInitialCosts(): Promise<void> {
    try {
      const properties = await this.propertyModel.find().exec();

    for (const prop of properties) {
      const roomTypes = await this.roomTypeModel.find({ propertyId: prop._id }).exec();

      for (const rt of roomTypes) {
        const existing = await this.propertyCostModel.findOne({
          propertyId: prop._id,
          roomTypeId: rt._id,
        }).exec();

        if (!existing) {
          const isSingle = rt.sharingType === 'SINGLE';
          const rent = rt.baseRent;
          const deposit = rt.deposit;
          const electricity = isSingle ? 1000 : 700;
          const maintenance = 350;
          const totalMonthly = rent + electricity + maintenance;

          const lineItems = [
            {
              name: 'Room Rent',
              amount: rent,
              category: CostCategory.FIXED,
              frequency: 'MONTHLY' as const,
              description: 'Base accommodation fee including 3 daily nutritious meals',
            },
            {
              name: 'Electricity Consumption (Estimated)',
              amount: electricity,
              category: CostCategory.ESTIMATED,
              frequency: 'MONTHLY' as const,
              description: 'Metered AC/room consumption billed at ₹9.00/unit',
            },
            {
              name: 'Housekeeping & Maintenance',
              amount: maintenance,
              category: CostCategory.FIXED,
              frequency: 'MONTHLY' as const,
              description: 'Daily room cleaning, common area upkeep, and waste collection',
            },
            {
              name: 'High-Speed Wi-Fi (150 Mbps)',
              amount: 0,
              category: CostCategory.FIXED,
              frequency: 'MONTHLY' as const,
              description: 'Complimentary high-speed optical fiber internet',
            },
            {
              name: 'Commute to Campus',
              amount: 0,
              category: CostCategory.ESTIMATED,
              frequency: 'MONTHLY' as const,
              description: 'Walking distance (under 300 meters from campus gate)',
            },
          ];

          await this.propertyCostModel.create({
            propertyId: prop._id,
            roomTypeId: rt._id,
            baseRent: rent,
            securityDeposit: deposit,
            depositRefundable: true,
            noticePeriodDays: 30,
            foodEstimate: 0, // Included in rent!
            electricityEstimate: electricity,
            maintenance,
            laundry: 0,
            internet: 0,
            commuteEstimate: 0,
            otherRecurring: 0,
            estimatedMonthlyTotal: totalMonthly,
            lineItems,
          });

          this.logger.log(
            `Seeded Total Living Cost for ${prop.name} - ${rt.name} (Rent: ₹${rent}, Monthly Total: ₹${totalMonthly})`,
          );
        }
      }
    }
    } catch (err: any) {
      this.logger.warn(`Initial pricing seeding skipped or deferred: ${err.message}`);
    }
  }
}
