import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  PropertyType,
  GenderPreference,
  FurnishingStatus,
} from '@apnaghar/shared-types';

export class NearbySearchDto {
  @ApiPropertyOptional({ example: 'college-uuid-here', description: 'Target college ID to measure radius from' })
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional({ example: 28.545, description: 'Latitude (if searching by GPS coordinates)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.1926, description: 'Longitude (if searching by GPS coordinates)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 3.0, default: 5.0, description: 'Search radius in kilometers' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(30.0)
  radiusKm?: number = 5.0;

  @ApiPropertyOptional({ example: 6000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRent?: number;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRent?: number;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: GenderPreference })
  @IsOptional()
  @IsEnum(GenderPreference)
  genderPreference?: GenderPreference;

  @ApiPropertyOptional({ enum: FurnishingStatus })
  @IsOptional()
  @IsEnum(FurnishingStatus)
  furnishing?: FurnishingStatus;

  @ApiPropertyOptional({ example: true, description: 'Filter properties with Air Conditioning availability' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasAirCondition?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Sharing capacity (1 for Single, 2 for Double)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  sharingCount?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedOnly?: boolean = true;

  @ApiPropertyOptional({
    example: 'distance_asc',
    enum: ['distance_asc', 'price_asc', 'price_desc', 'rating_desc'],
    default: 'distance_asc',
  })
  @IsOptional()
  @IsString()
  sort?: string = 'distance_asc';

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
