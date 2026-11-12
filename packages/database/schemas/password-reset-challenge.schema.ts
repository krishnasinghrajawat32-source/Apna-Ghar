import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetChallengeDocument = PasswordResetChallenge & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'password_reset_challenges',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      delete ret.challengeHash;
      return ret;
    },
  },
})
export class PasswordResetChallenge {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, select: false, index: true })
  challengeHash!: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ default: false, index: true })
  isUsed!: boolean;
}

export const PasswordResetChallengeSchema = SchemaFactory.createForClass(PasswordResetChallenge);

PasswordResetChallengeSchema.index({ challengeHash: 1, isUsed: 1, expiresAt: 1 });
