import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessSubscriptionDocument = MessSubscription & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'messSubscriptions',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class MessSubscription {
  @Prop({ required: true, uppercase: true, trim: true })
  subscriptionNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Mess', required: true, index: true })
  messId!: Types.ObjectId;

  @Prop({ required: true })
  planId!: string;

  @Prop({ required: true, trim: true })
  planName!: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ required: true, min: 0 })
  monthlyPrice!: number;

  @Prop({
    type: String,
    enum: ['VEG', 'NON_VEG', 'JAIN'],
    default: 'VEG',
  })
  dietaryPreference!: 'VEG' | 'NON_VEG' | 'JAIN';

  @Prop({
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE',
    index: true,
  })
  status!: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

  @Prop({ required: true, trim: true })
  qrPassCode!: string;
}

export const MessSubscriptionSchema = SchemaFactory.createForClass(MessSubscription);
MessSubscriptionSchema.index({ subscriptionNumber: 1 }, { unique: true });
MessSubscriptionSchema.index({ studentId: 1, status: 1 });
MessSubscriptionSchema.index({ messId: 1, status: 1 });
