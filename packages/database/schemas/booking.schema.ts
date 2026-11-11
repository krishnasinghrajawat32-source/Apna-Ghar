import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus } from '@apna-ghar/shared-types';

export type BookingDocument = Booking & Document<Types.ObjectId>;

@Schema({ _id: false })
export class EmergencyContactSchema {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  relationship!: string;

  @Prop({ required: true, trim: true })
  phone!: string;
}

@Schema({
  timestamps: true,
  collection: 'bookings',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Booking {
  @Prop({ required: true, uppercase: true, trim: true })
  bookingReference!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoomType', required: true, index: true })
  roomTypeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bed', required: true, index: true })
  bedId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  moveInDate!: Date;

  @Prop({ required: true, min: 0 })
  rentAmount!: number;

  @Prop({ required: true, min: 0 })
  depositAmount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  maintenanceFee!: number;

  @Prop({ required: true, min: 0, default: 0 })
  moveInCharges!: number;

  @Prop({ required: true, min: 0 })
  totalInitialPayment!: number;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING_PAYMENT,
    index: true,
  })
  status!: BookingStatus;

  @Prop({ type: EmergencyContactSchema, required: true })
  emergencyContact!: EmergencyContactSchema;

  @Prop({ type: String, trim: true, default: null })
  studentIdCardRef?: string;

  @Prop({ type: String, trim: true, default: null })
  cancelledReason?: string;

  @Prop({ type: Date, default: null })
  cancellationDate?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ studentId: 1, createdAt: -1 });
BookingSchema.index({ propertyId: 1, status: 1 });
BookingSchema.index({ bedId: 1, status: 1 });
BookingSchema.index({ bookingReference: 1 }, { unique: true });
