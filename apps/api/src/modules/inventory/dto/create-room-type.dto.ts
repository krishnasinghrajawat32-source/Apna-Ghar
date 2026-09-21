import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Standard Double Sharing AC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2, description: 'Number of beds/students in this room blueprint' })
  @IsNumber()
  @Min(1)
  sharingCount: number;

  @ApiProperty({ example: 8500.0, description: 'Monthly rent per bed' })
  @IsNumber()
  @Min(0)
  baseRent: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  hasAttachedBath: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  hasBalcony: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  hasAirCondition: boolean;
}
