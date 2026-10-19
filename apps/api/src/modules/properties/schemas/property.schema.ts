import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PropertyType,
  GenderPreference,
  FurnishingType,
  PropertyStatus,
} from '@apna-ghar/shared-types';

export type PropertyDocument = Property & Document<Types.ObjectId>;

@Schema({ _id: false })
export class PropertyGeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point', required: true })
  type!: string;

  // Canonical MongoDB coordinate format: [longitude, latitude]
  @Prop({ type: [Number], required: true })
  coordinates!: [number, number];
}

const PropertyGeoLocationSchema = SchemaFactory.createForClass(PropertyGeoLocation);

@Schema({ _id: false })
export class PropertyAddress {
  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ default: '', trim: true })
  landmark?: string;

  @Prop({ required: true, trim: true, index: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ required: true, trim: true })
  pincode!: string;
}

const PropertyAddressSchema = SchemaFactory.createForClass(PropertyAddress);

@Schema({
  timestamps: true,
  collection: 'properties',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Property {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({
    type: String,
    enum: Object.values(PropertyType),
    required: true,
    index: true,
  })
  propertyType!: PropertyType;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: PropertyAddressSchema, required: true })
  address!: PropertyAddress;

  @Prop({ type: PropertyGeoLocationSchema, required: true })
  location!: PropertyGeoLocation;

  @Prop({
    type: String,
    enum: Object.values(GenderPreference),
    required: true,
    index: true,
  })
  genderPreference!: GenderPreference;

  @Prop({
    type: String,
    enum: Object.values(FurnishingType),
    default: FurnishingType.FULLY_FURNISHED,
  })
  furnishing!: FurnishingType;

  @Prop({
    type: String,
    enum: Object.values(PropertyStatus),
    default: PropertyStatus.ACTIVE,
    index: true,
  })
  status!: PropertyStatus;

  @Prop({ type: [String], default: [] })
  amenities!: string[];

  @Prop({ type: [String], default: [] })
  rules!: string[];

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ default: false, index: true })
  isFullyVerified!: boolean;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  rating!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  reviewCount!: number;

  @Prop({ type: Date, default: () => new Date() })
  lastAvailabilityUpdatedAt!: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Critical 2dsphere index for proximity queries
PropertySchema.index({ location: '2dsphere' });
PropertySchema.index({ status: 1, genderPreference: 1 });
PropertySchema.index({ ownerId: 1, createdAt: -1 });
