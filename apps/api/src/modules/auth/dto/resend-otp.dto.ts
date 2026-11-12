import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { OtpPurpose } from '@apna-ghar/shared-types';

export class ResendOtpDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ enum: OtpPurpose, default: OtpPurpose.EMAIL_VERIFICATION })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;
}
