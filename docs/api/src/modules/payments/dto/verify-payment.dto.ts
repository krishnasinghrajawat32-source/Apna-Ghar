import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@apna-ghar/shared-types';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the booking', example: '6ad4e48590c6162694740199' })
  @IsMongoId()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({ description: 'Payment gateway order ID', example: 'order_test_12345' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: 'Payment gateway payment ID', example: 'pay_test_67890' })
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @ApiProperty({ description: 'HMAC SHA256 signature for verification', example: 'a1b2c3d4e5f6...' })
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @ApiPropertyOptional({
    description: 'Payment method utilized',
    enum: ['UPI', 'NETBANKING', 'CARD', 'WALLET', 'SIMULATOR'],
    example: 'UPI',
  })
  @IsOptional()
  @IsString()
  method?: PaymentMethod;
}
