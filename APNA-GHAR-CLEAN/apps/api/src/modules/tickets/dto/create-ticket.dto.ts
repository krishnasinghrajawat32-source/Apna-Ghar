import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { TicketCategory, TicketPriority } from '@apna-ghar/shared-types';

export class CreateTicketDto {
  @ApiProperty({ description: 'Property ObjectId', example: '6ad4e48590c6162694740160' })
  @IsMongoId()
  @IsNotEmpty()
  propertyId!: string;

  @ApiPropertyOptional({ description: 'Related Booking ObjectId', example: '6ad4e48590c6162694740199' })
  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @ApiProperty({
    description: 'Ticket issue category',
    enum: ['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'CLEANING', 'WIFI', 'OTHER'],
    example: 'WIFI',
  })
  @IsEnum(['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'CLEANING', 'WIFI', 'OTHER'])
  @IsNotEmpty()
  category!: TicketCategory;

  @ApiProperty({ description: 'Short summary of the issue', example: 'High speed Wi-Fi not connecting in Room 102' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Wi-Fi router on 1st floor seems disconnected since 6 PM. Need reset or technical check.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({
    description: 'Urgency priority',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'])
  priority?: TicketPriority;
}
