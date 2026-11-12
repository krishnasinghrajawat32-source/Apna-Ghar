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
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PropertyType,
  GenderPreference,
  FurnishingType,
  SharingType,
} from '@apna-ghar/shared-types';

export class GeoPointDto {
  @ApiProperty({ example: 'Point', default: 'Point' })
  @IsString()
  @IsNotEmpty()
  type: string = 'Point';

  // [longitude, latitude]
  @ApiProperty({ example: [77.209, 28.6139], description: '[longitude, latitude]' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}

export class AddressDto {
  @ApiProperty({ example: '123 University Road' })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ required: false, example: 'Opposite North Campus Gate' })
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

export class CreateRoomTypeInputDto {
  @ApiProperty({ example: 'Deluxe Double Sharing' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: SharingType, example: SharingType.DOUBLE })
  @IsEnum(SharingType)
  @IsNotEmpty()
  sharingType!: SharingType;

  @ApiProperty({ example: 8500 })
  @IsNumber()
  @Min(0)
  baseRent!: number;

  @ApiProperty({ example: 8500 })
  @IsNumber()
  @Min(0)
  deposit!: number;

  @ApiProperty({ default: true })
  @IsOptional()
  attachedBathroom?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  ac?: boolean;

  @ApiProperty({ type: [String], default: ['Bed', 'Study Table', 'Wardrobe'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  furnishingDetails?: string[];
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Greenwood Student Living' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.HOSTEL })
  @IsEnum(PropertyType)
  @IsNotEmpty()
  propertyType!: PropertyType;

  @ApiProperty({ example: 'Premium student accommodation with high-speed WiFi and verified security.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address!: AddressDto;

  @ApiProperty({ type: GeoPointDto })
  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsNotEmpty()
  location!: GeoPointDto;

  @ApiProperty({ required: false, example: 'ChIJ...googlePlaceId' })
  @IsString()
  @IsOptional()
  googlePlaceId?: string;

  @ApiProperty({ enum: GenderPreference, example: GenderPreference.BOYS })
  @IsEnum(GenderPreference)
  @IsNotEmpty()
  genderPreference!: GenderPreference;

  @ApiProperty({ enum: FurnishingType, default: FurnishingType.FULLY_FURNISHED })
  @IsEnum(FurnishingType)
  @IsOptional()
  furnishing?: FurnishingType;

  @ApiProperty({ type: [String], example: ['WiFi', 'Power Backup', 'CCTV', 'Biometric Entry', 'Laundry'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ type: [String], example: ['No Smoking', 'Curfew 10 PM', 'Guest registration required'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[];

  @ApiProperty({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ type: [CreateRoomTypeInputDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomTypeInputDto)
  @IsOptional()
  roomTypes?: CreateRoomTypeInputDto[];
}
