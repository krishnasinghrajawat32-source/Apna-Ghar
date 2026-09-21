import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Invalid email address provided.' })
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd2026!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
