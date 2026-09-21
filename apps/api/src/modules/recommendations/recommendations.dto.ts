import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GenderPreference } from '@apnaghar/shared-types';

export class GetRecommendationsDto {
  @IsOptional()
  @IsString()
  campusSlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  maxBudget?: number;

  @IsOptional()
  @IsEnum(GenderPreference)
  genderPreference?: GenderPreference;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return Array.isArray(value) ? value.map((s) => String(s).toLowerCase()) : [];
  })
  amenities?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
