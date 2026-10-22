import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '@apna-ghar/shared-types';

export class RegisterDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @ApiProperty({ example: 'rahul.sharma@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'Please provide a valid phone number (10 to 14 digits)',
  })
  phone!: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password!: string;

  @ApiProperty({
    enum: [UserRole.STUDENT, UserRole.OWNER, UserRole.MESS_PARTNER],
    example: UserRole.STUDENT,
  })
  @IsIn([UserRole.STUDENT, UserRole.OWNER, UserRole.MESS_PARTNER], {
    message: 'Role must be STUDENT, OWNER, or MESS_PARTNER',
  })
  role!: UserRole;
}
