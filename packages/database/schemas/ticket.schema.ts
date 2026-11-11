import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketCategory, TicketPriority, TicketStatus } from '@apna-ghar/shared-types';

export type TicketDocument = Ticket & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'maintenance_tickets',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Ticket {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', default: null })
  bookingId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'CLEANING', 'WIFI', 'OTHER'],
    required: true,
  })
  category!: TicketCategory;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    default: 'MEDIUM',
  })
  priority!: TicketPriority;

  @Prop({
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  })
  status!: TicketStatus;

  @Prop({ type: String, trim: true, default: null })
  resolutionNotes?: string;

  @Prop({ type: Date, default: null })
  resolvedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.index({ studentId: 1, createdAt: -1 });
TicketSchema.index({ propertyId: 1, status: 1 });
