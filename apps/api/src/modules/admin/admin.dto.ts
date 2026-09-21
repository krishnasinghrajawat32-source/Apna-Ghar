import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsInt,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UserRole, UserStatus } from '@apnaghar/shared-types';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  reason?: string;
}

export class ResolveReportDto {
  @IsBoolean()
  isResolved: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  actionTaken?: string;

  @IsOptional()
  @IsString()
  @Length(5, 1000)
  resolutionNotes?: string;
}

export class CreateCommissionRuleDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flatFee?: number;

  @IsString()
  @Length(2, 50)
  appliesTo: string;

  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class QueryReportsDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isResolved?: boolean;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
