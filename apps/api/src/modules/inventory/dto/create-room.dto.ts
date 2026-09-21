import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ArrayMinSize,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Room number or door label' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: 1, description: 'Floor number (0 = Ground Floor)' })
  @IsNumber()
  @Min(0)
  floor: number;

  @ApiProperty({
    example: ['Bed A', 'Bed B'],
    description: 'Labels for each atomic bed to instantiate in this room',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bedIdentifiers: string[];
}
