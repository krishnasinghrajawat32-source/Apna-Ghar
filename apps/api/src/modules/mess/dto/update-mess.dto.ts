import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietaryType } from '@apna-ghar/shared-types';
import { MessAddressDto, MessGeoPointDto, OperatingHoursDto, MealPlanItemDto } from './create-mess.dto';

export class UpdateMessDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['PURE_VEG', 'VEG_AND_NON_VEG', 'JAIN_AVAILABLE'], required: false })
  @IsEnum(['PURE_VEG', 'VEG_AND_NON_VEG', 'JAIN_AVAILABLE'])
  @IsOptional()
  dietaryType?: DietaryType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiProperty({ type: MessAddressDto, required: false })
  @ValidateNested()
  @Type(() => MessAddressDto)
  @IsOptional()
  address?: MessAddressDto;

  @ApiProperty({ type: MessGeoPointDto, required: false })
  @ValidateNested()
  @Type(() => MessGeoPointDto)
  @IsOptional()
  location?: MessGeoPointDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  googlePlaceId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0.5)
  @Max(50)
  @IsOptional()
  deliveryRadiusKm?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  deliveryTimings?: string;

  @ApiProperty({ type: OperatingHoursDto, required: false })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operatingHours?: OperatingHoursDto;

  @ApiProperty({ type: [String], required: false })
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

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], required: false })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';
}
