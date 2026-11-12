import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateVendorProfileDto {
  @ApiProperty({ required: false, example: 'Annapurna Caterers & Kitchens' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({ required: false, example: '10022011000456' })
  @IsString()
  @IsOptional()
  fssaiLicense?: string;

  @ApiProperty({ type: [String], required: false, example: ['North Campus', 'Kamla Nagar', 'Hudson Lane'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceAreas?: string[];
}
