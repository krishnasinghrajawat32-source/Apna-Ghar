import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OwnerProfileDocument = OwnerProfile & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'ownerProfiles',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class OwnerProfile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ default: '' })
  companyName?: string;

  @Prop({ default: '' })
  panNumber?: string;

  @Prop({ default: false })
  aadhaarVerified!: boolean;

  @Prop({ default: '' })
  businessAddress?: string;
}

export const OwnerProfileSchema = SchemaFactory.createForClass(OwnerProfile);
