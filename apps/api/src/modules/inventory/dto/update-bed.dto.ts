import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BedStatus } from '@apnaghar/shared-types';

export class UpdateBedStatusDto {
  @ApiProperty({
    enum: [BedStatus.AVAILABLE, BedStatus.MAINTENANCE, BedStatus.INACTIVE],
    example: BedStatus.MAINTENANCE,
    description: 'Manual bed status override (AVAILABLE, MAINTENANCE, or INACTIVE)',
  })
  @IsEnum(BedStatus)
  @IsNotEmpty()
  status: BedStatus;
}
