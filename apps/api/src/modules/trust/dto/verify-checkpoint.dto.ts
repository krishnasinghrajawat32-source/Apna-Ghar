import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationType, VerificationStatus } from '@apna-ghar/shared-types';

export class VerifyCheckpointDto {
  @ApiProperty({ enum: VerificationType, description: 'The audit checkpoint to verify' })
  @IsEnum(VerificationType)
  @IsNotEmpty()
  type!: VerificationType;

  @ApiProperty({ enum: VerificationStatus, description: 'Verification decision' })
  @IsEnum(VerificationStatus)
  @IsNotEmpty()
  status!: VerificationStatus;

  @ApiProperty({ required: false, description: 'Field notes from the verification audit' })
  @IsString()
  @IsOptional()
  notes?: string;
}
