import { Document, Types } from 'mongoose';
export type MessPartnerProfileDocument = MessPartnerProfile & Document<Types.ObjectId>;
export declare class MessPartnerProfile {
    userId: Types.ObjectId;
    businessName?: string;
    fssaiLicense?: string;
    serviceAreas: string[];
}
export declare const MessPartnerProfileSchema: import("mongoose").Schema<MessPartnerProfile, import("mongoose").Model<MessPartnerProfile, any, any, any, Document<unknown, any, MessPartnerProfile, any, {}> & MessPartnerProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MessPartnerProfile, Document<unknown, {}, import("mongoose").FlatRecord<MessPartnerProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MessPartnerProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=mess-partner-profile.schema.d.ts.map