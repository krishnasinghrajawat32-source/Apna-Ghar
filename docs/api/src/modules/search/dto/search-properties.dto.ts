import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GenderPreference, SharingType } from '@apna-ghar/shared-types';

export class SearchPropertiesDto {
  @ApiPropertyOptional({ description: 'College ID or slug' })
  @IsOptional()
  @IsString()
  college?: string;

  @ApiPropertyOptional({ description: 'Search radius in meters (e.g. 1000, 3000, 5000)', default: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(500)
  @Max(50000)
  radius?: number = 3000;

  @ApiPropertyOptional({ description: 'Minimum rent in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum rent in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: GenderPreference })
  @IsOptional()
  @IsIn(Object.values(GenderPreference))
  gender?: GenderPreference;

  @ApiPropertyOptional({ enum: SharingType })
  @IsOptional()
  @IsIn(Object.values(SharingType))
  sharing?: SharingType;

  @ApiPropertyOptional({ description: 'Filter by AC' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ac?: boolean;

  @ApiPropertyOptional({ description: 'Filter by Food Included' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  food?: boolean;

  @ApiPropertyOptional({ description: 'Filter by verified properties only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sort criteria: nearest | lowest_rent | recommended | recently_updated' })
  @IsOptional()
  @IsIn(['nearest', 'lowest_rent', 'recommended', 'recently_updated'])
  sort?: 'nearest' | 'lowest_rent' | 'recommended' | 'recently_updated' = 'recommended';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
