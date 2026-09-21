import { IsUUID, IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '@prisma/client';

export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'ID of the booking to pay for' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ enum: PaymentProvider, default: PaymentProvider.RAZORPAY })
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;
}

export class WebhookQueryDto {
  @ApiPropertyOptional({ enum: PaymentProvider, default: PaymentProvider.RAZORPAY })
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;
}
