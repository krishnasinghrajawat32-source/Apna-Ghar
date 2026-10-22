import { Document, Types } from 'mongoose';
export type MessSubscriptionDocument = MessSubscription & Document<Types.ObjectId>;
export declare class MessSubscription {
    subscriptionNumber: string;
    studentId: Types.ObjectId;
    messId: Types.ObjectId;
    planId: string;
    planName: string;
    startDate: Date;
    endDate: Date;
    monthlyPrice: number;
    dietaryPreference: 'VEG' | 'NON_VEG' | 'JAIN';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    qrPassCode: string;
}
export declare const MessSubscriptionSchema: import("mongoose").Schema<MessSubscription, import("mongoose").Model<MessSubscription, any, any, any, Document<unknown, any, MessSubscription, any, {}> & MessSubscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MessSubscription, Document<unknown, {}, import("mongoose").FlatRecord<MessSubscription>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MessSubscription> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=mess-subscription.schema.d.ts.map