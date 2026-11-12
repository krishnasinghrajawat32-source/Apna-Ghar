import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { BedPosition, BedStatus } from '@apna-ghar/shared-types';

export class CreateBedDto {
  @ApiProperty({ example: 'Bed A' })
  @IsString()
  @IsNotEmpty()
  bedLabel!: string;

  @ApiProperty({ enum: ['WINDOW', 'CORNER', 'DOOR', 'STANDARD'], default: 'STANDARD' })
  @IsEnum(['WINDOW', 'CORNER', 'DOOR', 'STANDARD'])
  @IsOptional()
  position?: BedPosition;

  @ApiProperty({ enum: BedStatus, default: BedStatus.AVAILABLE })
  @IsEnum(BedStatus)
  @IsOptional()
  permanentStatus?: BedStatus;
}
