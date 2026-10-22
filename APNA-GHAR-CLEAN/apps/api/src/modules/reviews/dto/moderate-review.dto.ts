import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@apna-ghar/shared-types';

export class ModerateReviewDto {
  @ApiProperty({ enum: ReviewStatus, description: 'New moderation status for the review' })
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @ApiPropertyOptional({ description: 'Optional moderation notes or rejection reason' })
  @IsOptional()
  @IsString()
  moderationNote?: string;
}
