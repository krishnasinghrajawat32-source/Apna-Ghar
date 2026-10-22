import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty({ description: 'ID of the property to visit' })
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({ description: 'Scheduled date of visit in YYYY-MM-DD or ISO string' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate!: string;

  @ApiProperty({ description: 'Time window slot for the visit', example: '10:00-12:00' })
  @IsString()
  @IsNotEmpty()
  slot!: string;

  @ApiProperty({ description: 'Student contact telephone for verification and directions', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  contactPhone!: string;

  @ApiProperty({ required: false, description: 'Optional special requests or questions for the owner' })
  @IsString()
  @IsOptional()
  notes?: string;
}
