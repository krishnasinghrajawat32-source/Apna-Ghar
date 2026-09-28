import { IsUUID, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID of the specific bed to book' })
  @IsString()
  @IsNotEmpty()
  bedId: string;

  @ApiProperty({ description: 'Planned move-in date (YYYY-MM-DD)', example: '2026-10-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ description: 'Planned move-out date (YYYY-MM-DD)', example: '2027-04-01' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation', example: 'Plans changed' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Check-in verification code or OTP' })
  @IsString()
  @IsOptional()
  otp?: string;
}
