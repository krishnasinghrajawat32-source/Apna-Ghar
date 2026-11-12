import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookingDecisionDto {
  @ApiProperty({ enum: ['ACCEPT', 'REJECT'], example: 'ACCEPT' })
  @IsEnum(['ACCEPT', 'REJECT'])
  @IsNotEmpty()
  decision!: 'ACCEPT' | 'REJECT';

  @ApiProperty({ required: false, example: 'Room is ready for student move-in' })
  @IsString()
  @IsOptional()
  reason?: string;
}
