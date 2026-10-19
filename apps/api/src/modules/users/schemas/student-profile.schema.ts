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

@Schema({ _id: false })
export class RoommatePreferences {
  @Prop({ type: String, enum: ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'], default: 'FLEXIBLE' })
  sleepSchedule!: 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE';

  @Prop({ type: String, enum: ['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN', 'ANY'], default: 'ANY' })
  foodPreference!: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGGETARIAN' | 'ANY';

  @Prop({ type: String, enum: ['STRICT', 'MODERATE', 'CASUAL'], default: 'MODERATE' })
  cleanlinessLevel!: 'STRICT' | 'MODERATE' | 'CASUAL';

  @Prop({ type: String, enum: ['SILENT', 'GROUP', 'MUSIC_OK'], default: 'SILENT' })
  studyHabits!: 'SILENT' | 'GROUP' | 'MUSIC_OK';

  @Prop({ type: Boolean, default: false })
  smoking!: boolean;

  @Prop({ type: [String], default: [] })
  hobbies!: string[];
}

const RoommatePreferencesSchema = SchemaFactory.createForClass(RoommatePreferences);

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

  @Prop({ type: RoommatePreferencesSchema, default: () => ({}) })
  roommatePreferences?: RoommatePreferences;
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);
