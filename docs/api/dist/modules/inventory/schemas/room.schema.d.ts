import { Document, Types } from 'mongoose';
export type RoomDocument = Room & Document<Types.ObjectId>;
export declare class Room {
    propertyId: Types.ObjectId;
    roomTypeId: Types.ObjectId;
    floorNumber: number;
    roomNumber: string;
    status: 'ACTIVE' | 'MAINTENANCE';
}
export declare const RoomSchema: import("mongoose").Schema<Room, import("mongoose").Model<Room, any, any, any, Document<unknown, any, Room, any, {}> & Room & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Room, Document<unknown, {}, import("mongoose").FlatRecord<Room>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Room> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=room.schema.d.ts.map