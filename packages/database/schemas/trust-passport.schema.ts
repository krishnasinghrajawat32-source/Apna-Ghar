import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  VerificationType,
  VerificationStatus,
} from '@apna-ghar/shared-types';

export type TrustPassportDocument = TrustPassport & Document<Types.ObjectId>;

@Schema({ _id: false })
export class CheckpointItem {
  @Prop({
    type: String,
    enum: Object.values(VerificationType),
    required: true,
  })
  type!: VerificationType;

  @Prop({
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  @Prop({ type: Date })
  verifiedAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ default: '' })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;
}

const CheckpointItemSchema = SchemaFactory.createForClass(CheckpointItem);

@Schema({
  timestamps: true,
  collection: 'trust_passports',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class TrustPassport {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, unique: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ default: false, index: true })
  isFullyVerified!: boolean;

  @Prop({ default: 0 })
  score!: number; // 0 to 7 checkpoints verified

  @Prop({ type: Date })
  lastVerifiedAt?: Date;

  @Prop({ type: [CheckpointItemSchema], default: [] })
  checkpoints!: CheckpointItem[];
}

export const TrustPassportSchema = SchemaFactory.createForClass(TrustPassport);

