import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VisitStatus } from '@apna-ghar/shared-types';

export class UpdateVisitStatusDto {
  @ApiProperty({ enum: VisitStatus, description: 'Updated visit status' })
  @IsEnum(VisitStatus)
  @IsNotEmpty()
  status!: VisitStatus;

  @ApiProperty({ required: false, description: 'Reason for cancellation, rejection or reschedule' })
  @IsString()
  @IsOptional()
  reason?: string;
}
