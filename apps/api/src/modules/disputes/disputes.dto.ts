import { IsUUID, IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({ description: 'ID of the booking to dispute' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Summary reason for dispute', example: 'Property misrepresentation' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Detailed explanation of the issue' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class AddEvidenceDto {
  @ApiProperty({ description: 'S3/R2 storage key of uploaded document or photo' })
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @ApiProperty({ description: 'MIME type of the evidence file', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Description of what this evidence shows' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeStatus, description: 'Arbitration outcome status' })
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status: DisputeStatus;

  @ApiProperty({ description: 'Official administrator decision notes' })
  @IsString()
  @IsNotEmpty()
  adminDecision: string;

  @ApiPropertyOptional({ description: 'Refund amount awarded to student, if applicable' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  refundAmount?: number;
}
