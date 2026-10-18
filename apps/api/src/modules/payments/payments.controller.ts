import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Payment Processing & Webhooks')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate payment order with payment gateway' })
  @ApiResponse({ status: 201, description: 'Payment order created with orderId and initial amount' })
  async createOrder(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    const order = await this.paymentsService.createOrder(studentId, dto);
    return {
      success: true,
      data: order,
    };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment gateway signature and confirm booking' })
  @ApiResponse({ status: 200, description: 'Payment verified and booking confirmed' })
  async verifyPayment(
    @CurrentUser('id') studentId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    const result = await this.paymentsService.verifyPayment(studentId, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('simulate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sandbox simulator to instantly complete test payment with valid HMAC signature' })
  @ApiResponse({ status: 200, description: 'Test payment simulated successfully' })
  async simulatePayment(
    @CurrentUser('id') studentId: string,
    @Body('orderId') orderId: string,
    @Body('method') method?: 'UPI' | 'NETBANKING' | 'CARD' | 'SIMULATOR',
  ) {
    const result = await this.paymentsService.simulatePayment(studentId, orderId, method);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment gateway webhook with HMAC SHA-256 signature verification' })
  @ApiHeader({ name: 'x-razorpay-signature', required: false })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const result = await this.paymentsService.handleWebhook(signature || '', payload);
    return {
      success: true,
      data: result,
    };
  }

  @Get('receipt/:bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve verified digital payment receipt for a confirmed booking' })
  @ApiResponse({ status: 200, description: 'Payment receipt with student and property breakdown' })
  async getReceipt(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const receipt = await this.paymentsService.getReceiptByBookingId(bookingId, userId, role);
    return {
      success: true,
      data: receipt,
    };
  }
}
