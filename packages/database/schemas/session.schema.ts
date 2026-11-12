import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { SessionRevocationReason } from '@apna-ghar/shared-types';

export type SessionDocument = Session & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'sessions',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      delete ret.tokenHash;
      return ret;
    },
  },
})
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, select: false, index: true })
  tokenHash!: string;

  @Prop({ default: '' })
  userAgent!: string;

  @Prop({ default: '' })
  ipAddress!: string;

  @Prop({ type: Date, default: () => new Date(), index: true })
  lastActivityAt!: Date;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ default: false, index: true })
  isRevoked!: boolean;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  @Prop({
    type: String,
    enum: Object.values(SessionRevocationReason),
    default: null,
  })
  revocationReason?: SessionRevocationReason | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Compound index for fast active session lookups and presence checks
SessionSchema.index({ userId: 1, isRevoked: 1, expiresAt: 1, lastActivityAt: 1 });
