import { IsMongoId } from 'class-validator';

export class StartConversationDto {
  @IsMongoId()
  propertyId!: string;
}
