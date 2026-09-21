import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { VerificationStatus } from '@apnaghar/shared-types';

export class ReviewVerificationDto {
  @ApiProperty({
    enum: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
    example: VerificationStatus.VERIFIED,
  })
  @IsEnum(VerificationStatus)
  @IsNotEmpty()
  status: VerificationStatus;

  @ApiProperty({ example: 95, description: 'Trust score from 0 to 100 based on document validity', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  verificationScore?: number;

  @ApiProperty({ example: 'Verified ownership deed and electricity utility bill successfully.', required: false })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
