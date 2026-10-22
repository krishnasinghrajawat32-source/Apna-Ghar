import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '@apna-ghar/shared-types';
export type PaymentDocument = Payment & Document<Types.ObjectId>;
export declare class Payment {
    bookingId: Types.ObjectId;
    studentId: Types.ObjectId;
    propertyId: Types.ObjectId;
    orderId: string;
    paymentId?: string;
    signature?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method?: PaymentMethod;
    failureReason?: string;
    receiptNumber: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, Document<unknown, any, Payment, any, {}> & Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, Document<unknown, {}, import("mongoose").FlatRecord<Payment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Payment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=payment.schema.d.ts.map