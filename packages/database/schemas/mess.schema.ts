import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DietaryType, MealType, DayOfWeek } from '@apna-ghar/shared-types';

export type MessDocument = Mess & Document<Types.ObjectId>;

@Schema({ _id: false })
export class MessAddress {
  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ required: true, trim: true, index: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ required: true, trim: true })
  pincode!: string;

  @Prop({ default: '', trim: true })
  landmark?: string;
}

const MessAddressSchema = SchemaFactory.createForClass(MessAddress);

@Schema({ _id: false })
export class OperatingHours {
  @Prop({ default: '07:30 - 09:30' })
  breakfast!: string;

  @Prop({ default: '12:30 - 14:30' })
  lunch!: string;

  @Prop({ default: '19:30 - 21:30' })
  dinner!: string;
}

const OperatingHoursSchema = SchemaFactory.createForClass(OperatingHours);

@Schema({ _id: false })
export class MealPlanSchema {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: [String], required: true })
  mealTypes!: MealType[];

  @Prop({ required: true, min: 1, max: 7 })
  daysPerWeek!: number;

  @Prop({ required: true, min: 0 })
  monthlyPrice!: number;

  @Prop({ default: '' })
  description?: string;
}

const MealPlanSubSchema = SchemaFactory.createForClass(MealPlanSchema);

@Schema({ _id: false })
export class DailyMenuSchema {
  @Prop({
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    required: true,
  })
  day!: DayOfWeek;

  @Prop({ required: true })
  breakfast!: string;

  @Prop({ required: true })
  lunch!: string;

  @Prop({ default: '' })
  snacks?: string;

  @Prop({ required: true })
  dinner!: string;

  @Prop({ default: '' })
  specialDietNote?: string;
}

const DailyMenuSubSchema = SchemaFactory.createForClass(DailyMenuSchema);

@Schema({
  timestamps: true,
  collection: 'messes',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Mess {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  partnerId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({
    type: String,
    enum: ['PURE_VEG', 'VEG_AND_NON_VEG', 'JAIN_AVAILABLE'],
    default: 'PURE_VEG',
    index: true,
  })
  dietaryType!: DietaryType;

  @Prop({ required: true, trim: true })
  fssaiNumber!: string;

  @Prop({ type: MessAddressSchema, required: true })
  address!: MessAddress;

  @Prop({ type: Number, default: 4.5, min: 1, max: 5 })
  rating!: number;

  @Prop({ default: true })
  hygieneCertified!: boolean;

  @Prop({ type: OperatingHoursSchema, default: () => ({}) })
  operatingHours!: OperatingHours;

  @Prop({ type: [MealPlanSubSchema], default: [] })
  plans!: MealPlanSchema[];

  @Prop({ type: [DailyMenuSubSchema], default: [] })
  weeklyMenu!: DailyMenuSchema[];

  @Prop({ type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true })
  status!: 'ACTIVE' | 'INACTIVE';
}

export const MessSchema = SchemaFactory.createForClass(Mess);
MessSchema.index({ 'address.city': 1, status: 1 });
MessSchema.index({ partnerId: 1, status: 1 });
