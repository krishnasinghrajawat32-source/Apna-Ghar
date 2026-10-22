import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@apna-ghar/shared-types';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: 'Updated ticket status',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    example: 'RESOLVED',
  })
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  @IsNotEmpty()
  status!: TicketStatus;

  @ApiPropertyOptional({
    description: 'Resolution remarks from property manager',
    example: 'Replaced Wi-Fi router power adapter. Connectivity restored.',
  })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
