import { IsMongoId, IsInt, Min, Max, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID of the property being reviewed' })
  @IsMongoId()
  propertyId!: string;

  @ApiProperty({ description: 'ID of the verified booking for this property' })
  @IsMongoId()
  bookingId!: string;

  @ApiProperty({ description: 'Overall rating between 1 and 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'Cleanliness rating between 1 and 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  cleanlinessRating!: number;

  @ApiProperty({ description: 'Food rating between 1 and 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  foodRating!: number;

  @ApiProperty({ description: 'Safety rating between 1 and 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  safetyRating!: number;

  @ApiProperty({ description: 'Written review comment' })
  @IsString()
  @IsNotEmpty()
  comment!: string;
}
