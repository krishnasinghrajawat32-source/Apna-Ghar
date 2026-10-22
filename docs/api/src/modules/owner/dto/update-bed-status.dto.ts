import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBedStatusDto {
  @ApiProperty({ enum: ['AVAILABLE', 'MAINTENANCE'], example: 'MAINTENANCE' })
  @IsEnum(['AVAILABLE', 'MAINTENANCE'])
  permanentStatus!: 'AVAILABLE' | 'MAINTENANCE';
}
