import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { UserRole, GenderPreference, DietaryType } from '@apnaghar/shared-types';

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Invalid email address provided.' })
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd2026!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole, { message: 'Role must be STUDENT, OWNER, or FOOD_PARTNER.' })
  role: UserRole;

  // Student Profile specific fields
  @ApiProperty({ example: 'Aarav', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Sharma', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'college-uuid-here', required: false })
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiProperty({ enum: GenderPreference, required: false })
  @IsOptional()
  @IsEnum(GenderPreference)
  gender?: GenderPreference;

  // Owner Profile specific fields
  @ApiProperty({ example: 'Rajesh Gupta', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'Gupta Living Spaces', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  // Food Partner specific fields
  @ApiProperty({ example: 'Annapurna Tiffin Service', required: false })
  @IsOptional()
  @IsString()
  kitchenName?: string;

  @ApiProperty({ example: 'Suresh Kumar', required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ example: 'Plot 42, Sector 15, Rohini', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 28.7041, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 77.1025, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
