import { Document, Types } from 'mongoose';
import { VisitStatus } from '@apna-ghar/shared-types';
export type VisitDocument = Visit & Document<Types.ObjectId>;
export declare class Visit {
    studentId: Types.ObjectId;
    propertyId: Types.ObjectId;
    ownerId: Types.ObjectId;
    scheduledAt: Date;
    slot: string;
    status: VisitStatus;
    contactPhone?: string;
    notes?: string;
    cancelledReason?: string;
}
export declare const VisitSchema: import("mongoose").Schema<Visit, import("mongoose").Model<Visit, any, any, any, Document<unknown, any, Visit, any, {}> & Visit & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Visit, Document<unknown, {}, import("mongoose").FlatRecord<Visit>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Visit> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=visit.schema.d.ts.map