import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '@apna-ghar/shared-types';

export type PaymentDocument = Payment & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'payments',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, index: true })
  bookingId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  orderId!: string;

  @Prop({ type: String, trim: true, default: null })
  paymentId?: string;

  @Prop({ type: String, trim: true, default: null })
  signature?: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, default: 'INR' })
  currency!: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.INITIATED,
    index: true,
  })
  status!: PaymentStatus;

  @Prop({ type: String, default: null })
  method?: PaymentMethod;

  @Prop({ type: String, default: null })
  failureReason?: string;

  @Prop({ required: true, trim: true })
  receiptNumber!: string;

  @Prop({ type: Date, default: null })
  paidAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ receiptNumber: 1 }, { unique: true });
PaymentSchema.index({ bookingId: 1, status: 1 });
PaymentSchema.index({ studentId: 1, createdAt: -1 });
