import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type AdminAuditLogDocument = AdminAuditLog & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'admin_audit_logs',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class AdminAuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  adminId!: Types.ObjectId;

  @Prop({ default: '' })
  adminEmail!: string;

  @Prop({ required: true, index: true })
  action!: string;

  @Prop({
    type: String,
    enum: ['USER', 'PROPERTY', 'MESS', 'MEDIA'],
    required: true,
    index: true,
  })
  targetType!: 'USER' | 'PROPERTY' | 'MESS' | 'MEDIA';

  @Prop({ required: true, index: true })
  targetId!: string;

  @Prop({ type: String, default: null })
  reason?: string | null;

  @Prop({ type: Object, default: null })
  diff?: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  ipAddress?: string | null;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);

AdminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
