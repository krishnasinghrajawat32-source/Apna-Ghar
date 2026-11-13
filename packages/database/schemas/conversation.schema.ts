import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@apna-ghar/shared-types';

export type ConversationDocument = Conversation & Document<Types.ObjectId>;

@Schema({ _id: false })
export class SharedStudentDetails {
  @Prop({ default: '', trim: true, maxlength: 100 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 150 })
  college!: string;

  @Prop({ type: Date, default: null })
  preferredMoveInDate?: Date | null;

  @Prop({ type: Number, default: null, min: 0 })
  monthlyBudget?: number | null;

  @Prop({ default: '', trim: true, maxlength: 500 })
  notes!: string;

  @Prop({ type: Date, default: null })
  sharedAt?: Date | null;
}

const SharedStudentDetailsSchema =
  SchemaFactory.createForClass(SharedStudentDetails);

@Schema({ _id: false })
export class ConversationParticipant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: [UserRole.STUDENT, UserRole.OWNER],
    required: true,
  })
  role!: UserRole.STUDENT | UserRole.OWNER;

  @Prop({ type: Number, default: 0, min: 0 })
  unreadCount!: number;

  @Prop({ type: Date, default: null })
  lastReadAt?: Date | null;
}

const ConversationParticipantSchema = SchemaFactory.createForClass(
  ConversationParticipant,
);

@Schema({
  timestamps: true,
  collection: 'conversations',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: [ConversationParticipantSchema], required: true })
  participants!: ConversationParticipant[];

  @Prop({ type: SharedStudentDetailsSchema, default: () => ({}) })
  sharedStudentDetails!: SharedStudentDetails;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ studentId: 1, propertyId: 1 }, { unique: true });
ConversationSchema.index({ ownerId: 1, updatedAt: -1 });
ConversationSchema.index({ studentId: 1, updatedAt: -1 });
