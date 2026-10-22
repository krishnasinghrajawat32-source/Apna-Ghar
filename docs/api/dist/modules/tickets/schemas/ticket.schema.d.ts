import { Document, Types } from 'mongoose';
import { TicketCategory, TicketPriority, TicketStatus } from '@apna-ghar/shared-types';
export type TicketDocument = Ticket & Document<Types.ObjectId>;
export declare class Ticket {
    studentId: Types.ObjectId;
    propertyId: Types.ObjectId;
    bookingId?: Types.ObjectId;
    category: TicketCategory;
    title: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    resolutionNotes?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TicketSchema: import("mongoose").Schema<Ticket, import("mongoose").Model<Ticket, any, any, any, Document<unknown, any, Ticket, any, {}> & Ticket & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Ticket, Document<unknown, {}, import("mongoose").FlatRecord<Ticket>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Ticket> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=ticket.schema.d.ts.map