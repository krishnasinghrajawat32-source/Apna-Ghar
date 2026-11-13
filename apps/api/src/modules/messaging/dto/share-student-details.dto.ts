import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ShareStudentDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  college?: string;

  @IsOptional()
  @IsDateString()
  preferredMoveInDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000000)
  monthlyBudget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
