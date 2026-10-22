import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { PropertyCostDocument } from './schemas/property-cost.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { TotalLivingCost } from '@apna-ghar/shared-types';
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
export declare class PricingService implements OnModuleInit {
    private readonly propertyCostModel;
    private readonly propertyModel;
    private readonly roomTypeModel;
    private readonly logger;
    constructor(propertyCostModel: Model<PropertyCostDocument>, propertyModel: Model<PropertyDocument>, roomTypeModel: Model<RoomTypeDocument>);
    onModuleInit(): Promise<void>;
    /**
     * Retrieves complete Total Living Cost breakdown for a property and optional room type
     */
    getCostBreakdown(propertyId: string, roomTypeId?: string): Promise<CostBreakdownResult>;
    /**
     * Seeds initial transparent cost structures for seeded properties
     */
    private seedInitialCosts;
}
//# sourceMappingURL=pricing.service.d.ts.map