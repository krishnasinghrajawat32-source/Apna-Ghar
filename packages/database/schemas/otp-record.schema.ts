import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OtpPurpose } from '@apna-ghar/shared-types';

export type OtpRecordDocument = OtpRecord & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'otp_records',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      delete ret.otpHash;
      return ret;
    },
  },
})
export class OtpRecord {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  otpHash!: string;

  @Prop({
    type: String,
    enum: Object.values(OtpPurpose),
    required: true,
    index: true,
  })
  purpose!: OtpPurpose;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ default: 5 })
  maxAttempts!: number;

  @Prop({ type: Date, required: true })
  resendCooldownUntil!: Date;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ default: false, index: true })
  isUsed!: boolean;
}

export const OtpRecordSchema = SchemaFactory.createForClass(OtpRecord);

OtpRecordSchema.index({ email: 1, purpose: 1, isUsed: 1, expiresAt: 1 });
OtpRecordSchema.index({ email: 1, createdAt: 1 });
