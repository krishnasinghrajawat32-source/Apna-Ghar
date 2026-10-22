import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessSubscriptionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  messId!: string;

  @ApiProperty({ example: 'plan-full-monthly' })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ enum: ['VEG', 'NON_VEG', 'JAIN'], example: 'VEG', required: false })
  @IsEnum(['VEG', 'NON_VEG', 'JAIN'])
  @IsOptional()
  dietaryPreference?: 'VEG' | 'NON_VEG' | 'JAIN';
}
