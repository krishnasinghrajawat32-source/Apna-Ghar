import {
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewCategory } from '@apnaghar/shared-types';

export class CreateReviewCategoryRatingDto {
  @IsString()
  category: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

export class CreateReviewDto {
  @IsUUID()
  bookingId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsString()
  @Length(5, 2000)
  comment: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReviewCategoryRatingDto)
  categoryRatings?: CreateReviewCategoryRatingDto[];
}

export class ReportReviewDto {
  @IsString()
  @Length(3, 100)
  reason: string;

  @IsString()
  @Length(5, 1000)
  details: string;
}

export class QueryReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
