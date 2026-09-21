import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { CreatePaymentOrderDto } from './payments.dto';
import { PaymentProvider, PaymentStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates or returns an existing gateway order for the given booking
   */
  async createPaymentOrder(userId: string, dto: CreatePaymentOrderDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required to initiate payment');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== student.id) {
      throw new ForbiddenException('Not authorized to pay for this booking');
    }

    if (
      booking.status !== BookingStatus.PAYMENT_PENDING &&
      booking.status !== BookingStatus.OWNER_APPROVED
    ) {
      throw new BadRequestException(`Cannot initiate payment for booking in status ${booking.status}`);
    }

    const provider = dto.provider || PaymentProvider.RAZORPAY;

    // Check if an existing active payment order exists
    const existing = await this.prisma.payment.findUnique({
      where: { bookingId: booking.id },
    });

    if (existing && existing.status === PaymentStatus.SUCCESS) {
      throw new ConflictException('Booking is already paid and confirmed');
    }

    if (existing && existing.status === PaymentStatus.CREATED) {
      return {
        paymentId: existing.id,
        provider: existing.provider,
        providerOrderId: existing.providerOrderId,
        amount: Number(existing.amount),
        currency: existing.currency,
        keyId: 'rzp_test_apnaghar2026',
      };
    }

    const providerOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const idempotencyKey = `idem_${booking.id}_${Date.now()}`;

    const payment = await this.prisma.payment.create({
      data: {
        booking: { connect: { id: booking.id } },
        userId,
        provider,
        providerOrderId,
        amount: booking.bookingAmount,
        currency: 'INR',
        status: PaymentStatus.CREATED,
        idempotencyKey,
      },
    });

    return {
      paymentId: payment.id,
      provider: payment.provider,
      providerOrderId: payment.providerOrderId,
      amount: Number(payment.amount),
      currency: payment.currency,
      keyId: 'rzp_test_apnaghar2026',
    };
  }

  /**
   * Cryptographic HMAC-SHA256 signature verification for webhook callbacks
   */
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');
      const sigBuffer = Buffer.from(signature, 'utf8');
      const digestBuffer = Buffer.from(digest, 'utf8');
      if (sigBuffer.length !== digestBuffer.length) return false;
      return crypto.timingSafeEqual(sigBuffer, digestBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Idempotent webhook settlement handler
   */
  async handleWebhook(signature: string | undefined, rawBody: string, parsedBody: any) {
    const webhookSecret = this.configService.get<string>('payment.webhookSecret') || 'test_webhook_secret_key_2026';

    if (!signature || !this.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      throw new BadRequestException('INVALID_WEBHOOK_SIGNATURE: Cryptographic verification failed');
    }

    // Extract orderId and paymentId from varying provider formats
    let orderId: string | undefined;
    let paymentId: string | undefined;

    if (parsedBody?.payload?.payment?.entity) {
      orderId = parsedBody.payload.payment.entity.order_id;
      paymentId = parsedBody.payload.payment.entity.id;
    } else {
      orderId = parsedBody?.orderId || parsedBody?.providerOrderId;
      paymentId = parsedBody?.paymentId || parsedBody?.providerPaymentId || `pay_${Date.now()}`;
    }

    if (!orderId) {
      throw new BadRequestException('Invalid webhook payload: order_id missing');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerOrderId: orderId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record for order ${orderId} not found`);
    }

    // Idempotency: If already settled, do not process again
    if (payment.status === PaymentStatus.SUCCESS) {
      this.logger.log(`Webhook already processed for order ${orderId}. Idempotent return.`);
      return {
        received: true,
        status: 'already_processed',
        bookingId: payment.bookingId,
      };
    }

    // Mark payment SUCCESS
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        providerPaymentId: paymentId,
        providerSignature: signature,
      },
    });

    // Automatically confirm the booking state machine and reserve bed
    await this.bookingsService.confirmBooking(payment.userId, payment.bookingId);

    return {
      received: true,
      status: 'confirmed',
      bookingId: payment.bookingId,
      paymentId: payment.id,
    };
  }

  async getPaymentByBookingId(userId: string, bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) {
      throw new NotFoundException('Payment record not found for this booking');
    }
    return payment;
  }
}
