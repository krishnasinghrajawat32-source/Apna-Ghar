import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class ModerateEntityDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'SUSPENDED'], example: 'APPROVED' })
  @IsEnum(['APPROVED', 'REJECTED', 'SUSPENDED'])
  @IsNotEmpty()
  status!: 'APPROVED' | 'REJECTED' | 'SUSPENDED';

  @ApiProperty({ required: false, example: 'Listing verified by admin review team' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ required: false, example: false, description: 'Only true if authorized physical inspection actually occurred' })
  @IsBoolean()
  @IsOptional()
  isPhysicallyVerified?: boolean;

  @ApiProperty({ required: false, example: 'Ground audit performed on site' })
  @IsString()
  @IsOptional()
  physicalInspectionNotes?: string;
}

export class ModerateUserDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'], example: 'ACTIVE' })
  @IsEnum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'])
  @IsNotEmpty()
  status!: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

  @ApiProperty({ required: false, example: 'KYC verified' })
  @IsString()
  @IsOptional()
  reason?: string;
}
