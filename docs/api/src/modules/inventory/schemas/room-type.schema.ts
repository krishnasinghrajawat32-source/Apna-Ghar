import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SharingType } from '@apna-ghar/shared-types';

export type RoomTypeDocument = RoomType & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'roomTypes',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class RoomType {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: Object.values(SharingType),
    required: true,
    index: true,
  })
  sharingType!: SharingType;

  @Prop({ required: true, min: 0, index: true })
  baseRent!: number;

  @Prop({ required: true, min: 0 })
  deposit!: number;

  @Prop({ default: true })
  attachedBathroom!: boolean;

  @Prop({ default: false, index: true })
  ac!: boolean;

  @Prop({ default: false, index: true })
  foodIncluded!: boolean;

  @Prop({ type: [String], default: [] })
  furnishingDetails!: string[];
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
RoomTypeSchema.index({ propertyId: 1, baseRent: 1 });
RoomTypeSchema.index({ propertyId: 1, sharingType: 1 });
