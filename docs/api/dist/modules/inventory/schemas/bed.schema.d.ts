import { Document, Types } from 'mongoose';
import { BedStatus } from '@apna-ghar/shared-types';
export type BedDocument = Bed & Document<Types.ObjectId>;
export declare class Bed {
    propertyId: Types.ObjectId;
    roomId: Types.ObjectId;
    roomTypeId: Types.ObjectId;
    bedLabel: string;
    position: 'WINDOW' | 'CORNER' | 'DOOR' | 'STANDARD';
    permanentStatus: BedStatus;
    expectedVacancyDate?: Date | null;
}
export declare const BedSchema: import("mongoose").Schema<Bed, import("mongoose").Model<Bed, any, any, any, Document<unknown, any, Bed, any, {}> & Bed & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Bed, Document<unknown, {}, import("mongoose").FlatRecord<Bed>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Bed> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=bed.schema.d.ts.map