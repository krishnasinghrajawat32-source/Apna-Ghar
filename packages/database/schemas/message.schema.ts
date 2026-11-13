import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@apna-ghar/shared-types';

export type MessageDocument = Message & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'messages',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: [UserRole.STUDENT, UserRole.OWNER],
    required: true,
  })
  senderRole!: UserRole.STUDENT | UserRole.OWNER;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  text!: string;

  @Prop({ type: Date, default: null })
  deliveredAt?: Date | null;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, senderId: 1, createdAt: -1 });
