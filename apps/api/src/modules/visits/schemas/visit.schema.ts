import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VisitStatus } from '@apna-ghar/shared-types';

export type VisitDocument = Visit & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'visits',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  scheduledAt!: Date;

  @Prop({ required: true, default: '10:00-12:00', trim: true })
  slot!: string;

  @Prop({
    type: String,
    enum: Object.values(VisitStatus),
    default: VisitStatus.REQUESTED,
    index: true,
  })
  status!: VisitStatus;

  @Prop({ default: '', trim: true })
  contactPhone?: string;

  @Prop({ default: '', trim: true })
  notes?: string;

  @Prop({ default: '', trim: true })
  cancelledReason?: string;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({ studentId: 1, scheduledAt: -1 });
VisitSchema.index({ ownerId: 1, scheduledAt: -1 });
VisitSchema.index({ propertyId: 1, scheduledAt: 1 });
