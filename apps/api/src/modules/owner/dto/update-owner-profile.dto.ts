import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOwnerProfileDto {
  @ApiProperty({ required: false, example: 'Aarav Housing Enterprises Pvt Ltd' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ required: false, example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiProperty({ required: false, example: '42 Commercial Complex, North Campus, Delhi' })
  @IsString()
  @IsOptional()
  businessAddress?: string;
}
