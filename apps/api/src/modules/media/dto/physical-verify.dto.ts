import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PhysicalVerifyMediaDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isPhysicallyVerified!: boolean;

  @ApiProperty({ required: false, example: 'Physical on-site audit completed by field inspector' })
  @IsString()
  @IsOptional()
  notes?: string;
}
