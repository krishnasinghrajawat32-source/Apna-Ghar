import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '60d5ec49f1b2c8b1f8c8e1a1', description: 'RoomType ID' })
  @IsString()
  @IsNotEmpty()
  roomTypeId!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  floorNumber!: number;

  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  roomNumber!: string;

  @ApiProperty({ enum: ['ACTIVE', 'MAINTENANCE'], default: 'ACTIVE' })
  @IsEnum(['ACTIVE', 'MAINTENANCE'])
  @IsOptional()
  status?: 'ACTIVE' | 'MAINTENANCE';
}
