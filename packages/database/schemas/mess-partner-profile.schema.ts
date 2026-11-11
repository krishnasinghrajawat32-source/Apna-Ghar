import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessPartnerProfileDocument = MessPartnerProfile & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'messPartnerProfiles',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class MessPartnerProfile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ default: '' })
  businessName?: string;

  @Prop({ default: '' })
  fssaiLicense?: string;

  @Prop({ type: [String], default: [] })
  serviceAreas!: string[];
}

export const MessPartnerProfileSchema = SchemaFactory.createForClass(MessPartnerProfile);
