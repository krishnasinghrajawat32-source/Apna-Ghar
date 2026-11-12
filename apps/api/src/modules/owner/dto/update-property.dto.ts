import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PropertyType,
  GenderPreference,
  FurnishingType,
  PropertyStatus,
} from '@apna-ghar/shared-types';
import { AddressDto, GeoPointDto } from './create-property.dto';

export class UpdatePropertyDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: PropertyType, required: false })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: AddressDto, required: false })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({ type: GeoPointDto, required: false })
  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  location?: GeoPointDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  googlePlaceId?: string;

  @ApiProperty({ enum: GenderPreference, required: false })
  @IsEnum(GenderPreference)
  @IsOptional()
  genderPreference?: GenderPreference;

  @ApiProperty({ enum: FurnishingType, required: false })
  @IsEnum(FurnishingType)
  @IsOptional()
  furnishing?: FurnishingType;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ enum: PropertyStatus, required: false })
  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;
}
