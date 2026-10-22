import { Document, Types } from 'mongoose';
import { CostCategory } from '@apna-ghar/shared-types';
export type PropertyCostDocument = PropertyCost & Document<Types.ObjectId>;
export declare class CostLineItem {
    name: string;
    amount: number;
    category: CostCategory;
    frequency: 'MONTHLY' | 'ONE_TIME' | 'ANNUAL';
    description?: string;
}
export declare class PropertyCost {
    propertyId: Types.ObjectId;
    roomTypeId?: Types.ObjectId;
    baseRent: number;
    securityDeposit: number;
    depositRefundable: boolean;
    noticePeriodDays: number;
    foodEstimate: number;
    electricityEstimate: number;
    maintenance: number;
    laundry: number;
    internet: number;
    commuteEstimate: number;
    otherRecurring: number;
    estimatedMonthlyTotal: number;
    lineItems: CostLineItem[];
}
export declare const PropertyCostSchema: import("mongoose").Schema<PropertyCost, import("mongoose").Model<PropertyCost, any, any, any, Document<unknown, any, PropertyCost, any, {}> & PropertyCost & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PropertyCost, Document<unknown, {}, import("mongoose").FlatRecord<PropertyCost>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PropertyCost> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=property-cost.schema.d.ts.map