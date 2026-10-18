import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BedStatus } from '@apna-ghar/shared-types';

export type BedDocument = Bed & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'beds',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Bed {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, index: true })
  roomId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoomType', required: true, index: true })
  roomTypeId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  bedLabel!: string;

  @Prop({
    type: String,
    enum: Object.values(BedStatus),
    default: BedStatus.AVAILABLE,
    index: true,
  })
  permanentStatus!: BedStatus;

  @Prop({ type: Date, default: null })
  expectedVacancyDate?: Date | null;
}

export const BedSchema = SchemaFactory.createForClass(Bed);
BedSchema.index({ propertyId: 1, permanentStatus: 1 });
BedSchema.index({ roomId: 1, permanentStatus: 1 });
BedSchema.index({ roomTypeId: 1, permanentStatus: 1 });
BedSchema.index({ roomId: 1, bedLabel: 1 }, { unique: true });
