import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MediaReviewStatus } from '@apna-ghar/shared-types';

export class ReviewMediaDto {
  @ApiProperty({ enum: MediaReviewStatus, example: MediaReviewStatus.APPROVED })
  @IsEnum(MediaReviewStatus)
  @IsNotEmpty()
  status!: MediaReviewStatus;

  @ApiProperty({ required: false, example: 'Verified clarity and authenticity of room photos' })
  @IsString()
  @IsOptional()
  reason?: string;
}
