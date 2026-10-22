import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'rooms',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Room {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoomType', required: true, index: true })
  roomTypeId!: Types.ObjectId;

  @Prop({ required: true })
  floorNumber!: number;

  @Prop({ required: true, trim: true })
  roomNumber!: string;

  @Prop({ type: String, enum: ['ACTIVE', 'MAINTENANCE'], default: 'ACTIVE' })
  status!: 'ACTIVE' | 'MAINTENANCE';
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ propertyId: 1, floorNumber: 1 });
RoomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
