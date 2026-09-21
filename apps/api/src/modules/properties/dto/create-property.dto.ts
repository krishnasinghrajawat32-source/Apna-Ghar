import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PropertyType,
  GenderPreference,
  FurnishingStatus,
} from '@apnaghar/shared-types';

export class CreateAddressDto {
  @ApiProperty({ example: '12-A, Hauz Khas Village' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Near Hauz Khas Metro Gate 2', required: false })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: 'New Delhi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '110016' })
  @IsString()
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({ example: 28.5494 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 77.2001 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Sunrise Luxury Student Living' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Modern, fully furnished student accommodation located 5 minutes from IIT Delhi campus.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.PG })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({ enum: GenderPreference, example: GenderPreference.CO_ED })
  @IsEnum(GenderPreference)
  genderPreference: GenderPreference;

  @ApiProperty({ enum: FurnishingStatus, example: FurnishingStatus.FULLY_FURNISHED })
  @IsEnum(FurnishingStatus)
  furnishing: FurnishingStatus;

  @ApiProperty({ type: CreateAddressDto })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  // Financial Breakdown
  @ApiProperty({ example: 10000.0, description: 'Refundable security deposit' })
  @IsNumber()
  @Min(0)
  securityDeposit: number;

  @ApiProperty({ example: 500.0, description: 'Monthly maintenance charges', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceCharges?: number;

  @ApiProperty({ example: 600.0, description: 'Estimated monthly electricity bill', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedElectricity?: number;

  @ApiProperty({ example: 200.0, description: 'Monthly water charges', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterCharges?: number;

  @ApiProperty({ example: true, description: 'Whether food/tiffin is provided on premises' })
  @IsBoolean()
  foodAvailability: boolean;

  @ApiProperty({ example: false, description: 'Whether food is included in the base rent' })
  @IsBoolean()
  foodIncludedInRent: boolean;

  // House Rules
  @ApiProperty({ example: 30, description: 'Notice period in days for move-out' })
  @IsNumber()
  @Min(0)
  noticePeriodDays: number;

  @ApiProperty({ example: '22:30', description: 'Curfew / gate closing time', required: false })
  @IsOptional()
  @IsString()
  gateClosingTime?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  smokingAllowed: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  alcoholAllowed: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  visitorsAllowed: boolean;

  // Amenities
  @ApiProperty({
    example: ['wifi-uuid', 'ac-uuid'],
    description: 'Array of Amenity UUIDs to associate with property',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityIds?: string[];
}
