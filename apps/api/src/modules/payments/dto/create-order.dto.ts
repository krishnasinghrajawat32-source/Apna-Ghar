import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the booking in PENDING_PAYMENT state',
    example: '6ad4e48590c6162694740199',
  })
  @IsMongoId()
  @IsNotEmpty()
  bookingId!: string;
}
