import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '8f4a1c5d9e...' })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @ApiProperty({ example: 'NewSecurePassword123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword!: string;
}
