import { Document, Types } from 'mongoose';
export type OwnerProfileDocument = OwnerProfile & Document<Types.ObjectId>;
export declare class OwnerProfile {
    userId: Types.ObjectId;
    companyName?: string;
    panNumber?: string;
    aadhaarVerified: boolean;
    businessAddress?: string;
}
export declare const OwnerProfileSchema: import("mongoose").Schema<OwnerProfile, import("mongoose").Model<OwnerProfile, any, any, any, Document<unknown, any, OwnerProfile, any, {}> & OwnerProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OwnerProfile, Document<unknown, {}, import("mongoose").FlatRecord<OwnerProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OwnerProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=owner-profile.schema.d.ts.map