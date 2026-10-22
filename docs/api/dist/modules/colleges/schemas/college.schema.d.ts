import { Document, Types } from 'mongoose';
export type CollegeDocument = College & Document<Types.ObjectId>;
export declare class GeoLocation {
    type: string;
    coordinates: [number, number];
}
export declare class College {
    name: string;
    slug: string;
    city: string;
    state: string;
    location: GeoLocation;
    status: 'ACTIVE' | 'INACTIVE';
}
export declare const CollegeSchema: import("mongoose").Schema<College, import("mongoose").Model<College, any, any, any, Document<unknown, any, College, any, {}> & College & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, College, Document<unknown, {}, import("mongoose").FlatRecord<College>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<College> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=college.schema.d.ts.map