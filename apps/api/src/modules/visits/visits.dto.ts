import { IsUUID, IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from '@prisma/client';

export class CreateVisitDto {
  @ApiProperty({ description: 'ID of the property to visit' })
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'Requested visit date (YYYY-MM-DD)', example: '2026-10-15' })
  @IsDateString()
  @IsNotEmpty()
  requestedDate: string;

  @ApiProperty({ description: 'Preferred time slot', example: '10:00 AM - 12:00 PM' })
  @IsString()
  @IsNotEmpty()
  requestedSlot: string;
}

export class UpdateVisitDto {
  @ApiProperty({ enum: VisitStatus, description: 'New visit status' })
  @IsEnum(VisitStatus)
  @IsNotEmpty()
  status: VisitStatus;

  @ApiPropertyOptional({ description: 'Confirmed time slot by owner', example: '11:00 AM - 12:00 PM' })
  @IsString()
  @IsOptional()
  confirmedSlot?: string;

  @ApiPropertyOptional({ description: 'Reason if visit is cancelled or rescheduled' })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}

export class CancelVisitDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsString()
  @IsOptional()
  reason?: string;
}
