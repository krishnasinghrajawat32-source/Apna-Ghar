import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollegeDocument = College & Document<Types.ObjectId>;

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point', required: true })
  type!: string;

  // Canonical MongoDB coordinate format: [longitude, latitude]
  @Prop({ type: [Number], required: true })
  coordinates!: [number, number];
}

const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);

@Schema({
  timestamps: true,
  collection: 'colleges',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class College {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ required: true, trim: true, index: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ type: GeoLocationSchema, required: true })
  location!: GeoLocation;

  @Prop({ type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true })
  status!: 'ACTIVE' | 'INACTIVE';
}

export const CollegeSchema = SchemaFactory.createForClass(College);

// 2dsphere index for geospatial proximity search
CollegeSchema.index({ location: '2dsphere' });
CollegeSchema.index({ name: 'text', city: 'text' });
