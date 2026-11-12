import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MediaType, MediaArea, MediaReviewStatus } from '@apna-ghar/shared-types';

export type MediaDocument = Media & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'media_records',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Media {
  @Prop({ required: true, trim: true })
  url!: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  storageKey!: string;

  @Prop({ required: true, trim: true })
  filename!: string;

  @Prop({ required: true, trim: true })
  mimeType!: string;

  @Prop({ required: true, min: 0 })
  sizeBytes!: number;

  @Prop({
    type: String,
    enum: Object.values(MediaType),
    default: MediaType.IMAGE,
    index: true,
  })
  mediaType!: MediaType;

  @Prop({
    type: String,
    enum: Object.values(MediaArea),
    default: MediaArea.PROPERTY,
    index: true,
  })
  area!: MediaArea;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploaderId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PROPERTY', 'ROOM', 'MESS', 'USER_KYC', 'OTHER'],
    default: 'PROPERTY',
    index: true,
  })
  relatedEntityType!: string;

  @Prop({ type: Types.ObjectId, default: null, index: true })
  relatedEntityId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(MediaReviewStatus),
    default: MediaReviewStatus.PENDING,
    index: true,
  })
  reviewStatus!: MediaReviewStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date;

  @Prop({ type: String, trim: true, default: '' })
  reviewReason?: string;

  @Prop({ default: false, index: true })
  isPhysicallyVerified!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  physicalVerifiedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  physicalVerifiedAt?: Date;

  @Prop({ type: String, trim: true, default: '' })
  physicalVerificationNotes?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ uploaderId: 1, createdAt: -1 });
MediaSchema.index({ relatedEntityType: 1, relatedEntityId: 1 });
MediaSchema.index({ reviewStatus: 1, isPhysicallyVerified: 1 });
