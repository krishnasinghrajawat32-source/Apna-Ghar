import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReviewStatus } from '@apna-ghar/shared-types';

export type ReviewDocument = Review & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'reviews',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, index: true })
  bookingId!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ required: true, min: 1, max: 5 })
  cleanlinessRating!: number;

  @Prop({ required: true, min: 1, max: 5 })
  foodRating!: number;

  @Prop({ required: true, min: 1, max: 5 })
  safetyRating!: number;

  @Prop({ required: true, trim: true })
  comment!: string;

  @Prop({ default: true })
  verifiedStay!: boolean;

  @Prop({
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.APPROVED,
    index: true,
  })
  status!: ReviewStatus;

  @Prop({ type: String, trim: true, default: null })
  moderationNote?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ propertyId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ studentId: 1, bookingId: 1 }, { unique: true });
