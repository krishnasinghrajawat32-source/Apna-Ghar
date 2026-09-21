import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelAndRefundDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation', example: 'College admission changed' })
  @IsString()
  @IsOptional()
  reason?: string;
}
