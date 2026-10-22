import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '@apna-ghar/shared-types';

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'Target booking lifecycle status',
    enum: BookingStatus,
    example: BookingStatus.CANCELLED,
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status!: BookingStatus;

  @ApiPropertyOptional({
    description: 'Reason for cancellation or rejection',
    example: 'Changed college admission plans',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
