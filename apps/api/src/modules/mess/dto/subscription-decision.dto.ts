import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubscriptionDecisionDto {
  @ApiProperty({ enum: ['ACCEPT', 'REJECT', 'COMPLETE'], example: 'ACCEPT' })
  @IsEnum(['ACCEPT', 'REJECT', 'COMPLETE'])
  @IsNotEmpty()
  decision!: 'ACCEPT' | 'REJECT' | 'COMPLETE';

  @ApiProperty({ required: false, example: 'Meal pass accepted and dining card active' })
  @IsString()
  @IsOptional()
  reason?: string;
}
