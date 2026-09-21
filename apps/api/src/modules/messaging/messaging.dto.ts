import {
  IsString,
  IsUUID,
  IsOptional,
  Length,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @IsUUID()
  recipientUserId: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  initialMessage?: string;
}

export class SendMessageDto {
  @IsString()
  @Length(1, 2000)
  content: string;
}

export class QueryMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  before?: string;
}
