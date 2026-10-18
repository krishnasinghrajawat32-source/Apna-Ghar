import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GenderPreference } from '@apna-ghar/shared-types';

export type StudentProfileDocument = StudentProfile & Document<Types.ObjectId>;

@Schema({ _id: false })
export class EmergencyContact {
  @Prop({ default: '' })
  name!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  relation!: string;
}

const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

@Schema({
  timestamps: true,
  collection: 'studentProfiles',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class StudentProfile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College', default: null })
  collegeId?: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: Object.values(GenderPreference),
    default: null,
  })
  gender?: GenderPreference | null;

  @Prop({ default: '' })
  course?: string;

  @Prop({ type: Number, default: 1 })
  yearOfStudy?: number;

  @Prop({ type: EmergencyContactSchema, default: () => ({}) })
  emergencyContact?: EmergencyContact;
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);
