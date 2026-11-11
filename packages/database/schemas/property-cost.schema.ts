import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CostCategory } from '@apna-ghar/shared-types';

export type PropertyCostDocument = PropertyCost & Document<Types.ObjectId>;

@Schema({ _id: false })
export class CostLineItem {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({
    type: String,
    enum: Object.values(CostCategory),
    default: CostCategory.FIXED,
  })
  category!: CostCategory;

  @Prop({
    type: String,
    enum: ['MONTHLY', 'ONE_TIME', 'ANNUAL'],
    default: 'MONTHLY',
  })
  frequency!: 'MONTHLY' | 'ONE_TIME' | 'ANNUAL';

  @Prop({ default: '' })
  description?: string;
}

const CostLineItemSchema = SchemaFactory.createForClass(CostLineItem);

@Schema({
  timestamps: true,
  collection: 'property_costs',
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class PropertyCost {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoomType', index: true })
  roomTypeId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  baseRent!: number;

  @Prop({ required: true, min: 0 })
  securityDeposit!: number;

  @Prop({ default: true })
  depositRefundable!: boolean;

  @Prop({ default: 30 })
  noticePeriodDays!: number;

  @Prop({ default: 0, min: 0 })
  foodEstimate!: number;

  @Prop({ default: 0, min: 0 })
  electricityEstimate!: number;

  @Prop({ default: 0, min: 0 })
  maintenance!: number;

  @Prop({ default: 0, min: 0 })
  laundry!: number;

  @Prop({ default: 0, min: 0 })
  internet!: number;

  @Prop({ default: 0, min: 0 })
  commuteEstimate!: number;

  @Prop({ default: 0, min: 0 })
  otherRecurring!: number;

  @Prop({ required: true, min: 0 })
  estimatedMonthlyTotal!: number;

  @Prop({ type: [CostLineItemSchema], default: [] })
  lineItems!: CostLineItem[];
}

export const PropertyCostSchema = SchemaFactory.createForClass(PropertyCost);

PropertyCostSchema.index({ propertyId: 1, roomTypeId: 1 });
