import { Document, Types } from 'mongoose';
import { SharingType } from '@apna-ghar/shared-types';
export type RoomTypeDocument = RoomType & Document<Types.ObjectId>;
export declare class RoomType {
    propertyId: Types.ObjectId;
    name: string;
    sharingType: SharingType;
    baseRent: number;
    deposit: number;
    attachedBathroom: boolean;
    ac: boolean;
    foodIncluded: boolean;
    furnishingDetails: string[];
}
export declare const RoomTypeSchema: import("mongoose").Schema<RoomType, import("mongoose").Model<RoomType, any, any, any, Document<unknown, any, RoomType, any, {}> & RoomType & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RoomType, Document<unknown, {}, import("mongoose").FlatRecord<RoomType>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<RoomType> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=room-type.schema.d.ts.map