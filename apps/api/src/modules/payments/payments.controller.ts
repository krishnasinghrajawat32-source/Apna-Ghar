import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './payments.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment gateway order for a booking in hold' })
  @ApiResponse({ status: 201, description: 'Payment order created' })
  async createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createPaymentOrder(user.id, dto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive and verify HMAC-SHA256 payment gateway webhooks' })
  @ApiHeader({ name: 'x-razorpay-signature', required: false })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid cryptographic signature' })
  async handleWebhook(
    @Headers('x-razorpay-signature') razorpaySignature: string,
    @Headers('x-webhook-signature') genericSignature: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const signature = razorpaySignature || genericSignature;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(body);
    return this.paymentsService.handleWebhook(signature, rawBody, body);
  }

  @Get('booking/:bookingId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get payment details for a given booking' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async getPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentsService.getPaymentByBookingId(user.id, bookingId);
  }
}
