import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsDateString,
  ValidateNested,
  Matches,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmergencyContactDto {
  @ApiProperty({ description: 'Full name of emergency contact', example: 'Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Relationship to student', example: 'Father' })
  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @ApiProperty({ description: '10-digit phone number', example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Emergency contact phone number must be a valid 10-digit Indian mobile number',
  })
  phone!: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the bed currently held in Redis',
    example: '6ad4e48590c6162694740178',
  })
  @IsMongoId()
  @IsNotEmpty()
  bedId!: string;

  @ApiProperty({
    description: 'Anticipated move-in date (ISO-8601 string, must be within next 60 days)',
    example: '2026-11-01',
  })
  @IsDateString()
  @IsNotEmpty()
  moveInDate!: string;

  @ApiProperty({ description: 'Emergency contact details', type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact!: EmergencyContactDto;

  @ApiPropertyOptional({
    description: 'Reference / URL to uploaded student college ID card',
    example: 'student-id-docs/amity-2026-id.pdf',
  })
  @IsOptional()
  @IsString()
  studentIdCardRef?: string;
}
