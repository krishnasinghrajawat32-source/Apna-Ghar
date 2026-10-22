import { Document, Types } from 'mongoose';
import { BookingStatus } from '@apna-ghar/shared-types';
export type BookingDocument = Booking & Document<Types.ObjectId>;
export declare class EmergencyContactSchema {
    name: string;
    relationship: string;
    phone: string;
}
export declare class Booking {
    bookingReference: string;
    studentId: Types.ObjectId;
    propertyId: Types.ObjectId;
    roomTypeId: Types.ObjectId;
    roomId: Types.ObjectId;
    bedId: Types.ObjectId;
    moveInDate: Date;
    rentAmount: number;
    depositAmount: number;
    maintenanceFee: number;
    moveInCharges: number;
    totalInitialPayment: number;
    status: BookingStatus;
    emergencyContact: EmergencyContactSchema;
    studentIdCardRef?: string;
    cancelledReason?: string;
    cancellationDate?: Date;
}
export declare const BookingSchema: import("mongoose").Schema<Booking, import("mongoose").Model<Booking, any, any, any, Document<unknown, any, Booking, any, {}> & Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Booking, Document<unknown, {}, import("mongoose").FlatRecord<Booking>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Booking> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=booking.schema.d.ts.map