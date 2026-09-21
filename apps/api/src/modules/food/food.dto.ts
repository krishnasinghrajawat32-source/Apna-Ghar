import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DietaryType,
  MealPlanFrequency,
  FoodOrderStatus,
} from '@prisma/client';

export class CreateMenuDto {
  @ApiProperty({ description: 'Title of the menu (e.g. Daily North Indian & Tiffin Menu)' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name (e.g. Thalis, Breads, Beverages)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Display ordering priority', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateMenuItemDto {
  @ApiProperty({ description: 'Dish name', example: 'Special Student Veg Thali' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Dish description', example: 'Dal Makhani, Paneer, 4 Butter Rotis, Rice, Salad' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price in INR', example: 120 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ enum: DietaryType, description: 'Dietary classification' })
  @IsEnum(DietaryType)
  @IsNotEmpty()
  dietaryType: DietaryType;

  @ApiPropertyOptional({ description: 'Availability flag', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Image CDN URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateMealPlanDto {
  @ApiProperty({ description: 'Title of the meal plan', example: 'Monthly Unlimited Student Lunch & Dinner' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed plan description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: MealPlanFrequency, description: 'Frequency billing cycle' })
  @IsEnum(MealPlanFrequency)
  @IsNotEmpty()
  frequency: MealPlanFrequency;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includesBreakfast?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includesLunch?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includesDinner?: boolean;

  @ApiProperty({ description: 'Total price for subscription period in INR', example: 4500 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ enum: DietaryType, description: 'Dietary classification' })
  @IsEnum(DietaryType)
  @IsNotEmpty()
  dietaryType: DietaryType;
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Target menu item ID' })
  @IsUUID()
  @IsNotEmpty()
  menuItemId: string;

  @ApiProperty({ description: 'Item quantity', default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateFoodOrderDto {
  @ApiProperty({ description: 'Target food partner ID' })
  @IsUUID()
  @IsNotEmpty()
  foodPartnerId: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'List of dishes ordered' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ description: 'Hostel/PG delivery address' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiPropertyOptional({ description: 'Special delivery instructions' })
  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}

export class UpdateFoodOrderStatusDto {
  @ApiProperty({ enum: FoodOrderStatus, description: 'New order lifecycle status' })
  @IsEnum(FoodOrderStatus)
  @IsNotEmpty()
  status: FoodOrderStatus;
}

export class CreateFoodSubscriptionDto {
  @ApiProperty({ description: 'Target meal plan ID' })
  @IsUUID()
  @IsNotEmpty()
  mealPlanId: string;

  @ApiProperty({ description: 'Subscription start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Subscription end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Hostel/PG delivery address' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;
}
