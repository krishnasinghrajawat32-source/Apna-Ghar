import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MediaType, MediaArea } from '@apna-ghar/shared-types';

export class UploadMediaDto {
  @ApiProperty({ enum: MediaType, default: MediaType.IMAGE })
  @IsEnum(MediaType)
  @IsNotEmpty()
  mediaType!: MediaType;

  @ApiProperty({ enum: MediaArea, default: MediaArea.PROPERTY })
  @IsEnum(MediaArea)
  @IsNotEmpty()
  area!: MediaArea;

  @ApiProperty({ enum: ['PROPERTY', 'ROOM', 'MESS', 'USER_KYC', 'OTHER'], default: 'PROPERTY' })
  @IsString()
  @IsNotEmpty()
  relatedEntityType!: string;

  @ApiProperty({ required: false, description: 'ID of the property, room, or mess' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}
