import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietaryType, MealType } from '@apna-ghar/shared-types';

export class MessGeoPointDto {
  @ApiProperty({ example: 'Point', default: 'Point' })
  @IsString()
  @IsNotEmpty()
  type: string = 'Point';

  @ApiProperty({ example: [77.209, 28.6139], description: '[longitude, latitude]' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}

export class MessAddressDto {
  @ApiProperty({ example: '45 Food Street, North Campus' })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ required: false, example: 'Behind Metro Station' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiProperty({ example: 'New Delhi' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: '110007' })
  @IsString()
  @IsNotEmpty()
  pincode!: string;
}

export class OperatingHoursDto {
  @ApiProperty({ default: '07:30 - 09:30' })
  @IsString()
  @IsOptional()
  breakfast?: string;

  @ApiProperty({ default: '12:30 - 14:30' })
  @IsString()
  @IsOptional()
  lunch?: string;

  @ApiProperty({ default: '19:30 - 21:30' })
  @IsString()
  @IsOptional()
  dinner?: string;
}

export class MealPlanItemDto {
  @ApiProperty({ example: 'plan-full-month' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 'Full 3-Meal Student Plan' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ type: [String], example: ['BREAKFAST', 'LUNCH', 'DINNER'] })
  @IsArray()
  @IsString({ each: true })
  mealTypes!: MealType[];

  @ApiProperty({ example: 7 })
  @IsNumber()
  @Min(1)
  @Max(7)
  daysPerWeek!: number;

  @ApiProperty({ example: 3200, description: 'Display price in INR (listing info only)' })
  @IsNumber()
  @Min(0)
  monthlyPrice!: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateMessDto {
  @ApiProperty({ example: 'Annapurna Student Food Services' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Wholesome, home-style North and South Indian student meal plans.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: ['PURE_VEG', 'VEG_AND_NON_VEG', 'JAIN_AVAILABLE'], example: 'PURE_VEG' })
  @IsEnum(['PURE_VEG', 'VEG_AND_NON_VEG', 'JAIN_AVAILABLE'])
  @IsNotEmpty()
  dietaryType!: DietaryType;

  @ApiProperty({ example: '10022011000456' })
  @IsString()
  @IsNotEmpty()
  fssaiNumber!: string;

  @ApiProperty({ type: MessAddressDto })
  @ValidateNested()
  @Type(() => MessAddressDto)
  @IsNotEmpty()
  address!: MessAddressDto;

  @ApiProperty({ type: MessGeoPointDto, required: false })
  @ValidateNested()
  @Type(() => MessGeoPointDto)
  @IsOptional()
  location?: MessGeoPointDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  googlePlaceId?: string;

  @ApiProperty({ example: 5, default: 5, description: 'Delivery coverage radius in km' })
  @IsNumber()
  @Min(0.5)
  @Max(50)
  @IsOptional()
  deliveryRadiusKm?: number;

  @ApiProperty({ example: 'Breakfast: 8-10 AM, Lunch: 12-2 PM, Dinner: 7-9 PM' })
  @IsString()
  @IsOptional()
  deliveryTimings?: string;

  @ApiProperty({ type: OperatingHoursDto, required: false })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operatingHours?: OperatingHoursDto;

  @ApiProperty({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ type: [MealPlanItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanItemDto)
  @IsOptional()
  plans?: MealPlanItemDto[];
}
