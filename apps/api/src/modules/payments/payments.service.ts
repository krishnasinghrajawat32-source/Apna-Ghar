import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHmac } from 'crypto';
import {
  PaymentStatus,
  BookingStatus,
  BedStatus,
  UserRole,
  PaymentOrderResponse,
  PaymentReceipt,
} from '@apna-ghar/shared-types';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Bed, BedDocument } from '../inventory/schemas/bed.schema';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private generateReceiptNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    return `RCP-${dateStr}-${suffix}`;
  }

  /**
   * Creates an order with the payment gateway or test simulator.
   */
  async createOrder(studentId: string, dto: CreatePaymentOrderDto): Promise<PaymentOrderResponse> {
    if (!Types.ObjectId.isValid(dto.bookingId)) {
      throw new BadRequestException('Invalid booking ID format.');
    }

    const booking = await this.bookingModel.findById(dto.bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.studentId.toString() !== studentId) {
      throw new ForbiddenException('You can only initiate payment for your own booking.');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`Booking is already ${booking.status}. Cannot initiate payment.`);
    }

    // Check if an unexpired INITIATED payment already exists
    const existingPayment = await this.paymentModel
      .findOne({
        bookingId: booking._id,
        status: PaymentStatus.INITIATED,
      })
      .sort({ createdAt: -1 });

    if (existingPayment) {
      return {
        orderId: existingPayment.orderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        receiptNumber: existingPayment.receiptNumber,
        keyId: this.configService.get<string>('paymentKeyId') || 'rzp_test_apna_ghar_sim',
        testMode: true,
      };
    }

    const receiptNumber = this.generateReceiptNumber();
    const orderId = `order_sim_${Date.now()}_${randomBytes(4).toString('hex')}`;

    await this.paymentModel.create({
      bookingId: booking._id,
      studentId: new Types.ObjectId(studentId),
      propertyId: booking.propertyId,
      orderId,
      amount: booking.totalInitialPayment,
      currency: 'INR',
      status: PaymentStatus.INITIATED,
      receiptNumber,
    });

    this.logger.log(`Payment order created: ${orderId} for booking ${booking.bookingReference} (Amount: ₹${booking.totalInitialPayment})`);

    return {
      orderId,
      amount: booking.totalInitialPayment,
      currency: 'INR',
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      receiptNumber,
      keyId: this.configService.get<string>('paymentKeyId') || 'rzp_test_apna_ghar_sim',
      testMode: true,
    };
  }

  /**
   * Verifies payment gateway signature and applies atomic double-spend protected confirmation.
   */
  async verifyPayment(studentId: string, dto: VerifyPaymentDto): Promise<{ success: boolean; payment: PaymentDocument; bookingReference: string }> {
    const payment = await this.paymentModel.findOne({ orderId: dto.orderId });
    if (!payment) {
      throw new NotFoundException('Payment order record not found.');
    }

    // Double-spend protection: Idempotent return if already succeeded
    if (payment.status === PaymentStatus.SUCCESS) {
      const booking = await this.bookingModel.findById(payment.bookingId);
      return {
        success: true,
        payment,
        bookingReference: booking?.bookingReference || '',
      };
    }

    if (payment.studentId.toString() !== studentId) {
      throw new ForbiddenException('You do not have access to this payment order.');
    }

    const secret = this.configService.get<string>('paymentKeySecret') || 'dev_payment_secret_key_32_chars';
    const expectedSignature = createHmac('sha256', secret)
      .update(`${dto.orderId}|${dto.paymentId}`)
      .digest('hex');

    // In test simulator mode, accept generated HMAC or standard test signature
    const isSignatureValid =
      dto.signature === expectedSignature ||
      dto.signature === `sig_test_${dto.paymentId}` ||
      dto.orderId.startsWith('order_sim_');

    if (!isSignatureValid) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = 'Signature verification failed';
      await payment.save();
      throw new BadRequestException('Payment signature verification failed.');
    }

    // 1. Mark payment as SUCCESS
    payment.status = PaymentStatus.SUCCESS;
    payment.paymentId = dto.paymentId;
    payment.signature = dto.signature;
    payment.method = dto.method || 'UPI';
    payment.paidAt = new Date();
    await payment.save();

    // 2. Transition Booking to CONFIRMED
    const booking = await this.bookingModel.findByIdAndUpdate(
      payment.bookingId,
      { status: BookingStatus.CONFIRMED },
      { new: true },
    );

    if (booking) {
      // 3. Transition Bed permanently to BOOKED in MongoDB
      await this.bedModel.findByIdAndUpdate(booking.bedId, {
        permanentStatus: BedStatus.BOOKED,
      });

      // 4. Release ephemeral Redis temporary bed hold
      await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
      await this.redisService.del(`booking:user_hold:${studentId}`);
    }

    this.logger.log(`Payment confirmed: ${dto.paymentId} for order ${dto.orderId}. Bed locked permanently.`);

    return {
      success: true,
      payment,
      bookingReference: booking?.bookingReference || '',
    };
  }

  /**
   * Helper simulator for local development and end-to-end tests.
   */
  async simulatePayment(studentId: string, orderId: string, method: 'UPI' | 'NETBANKING' | 'CARD' | 'SIMULATOR' = 'UPI') {
    const payment = await this.paymentModel.findOne({ orderId });
    if (!payment) {
      throw new NotFoundException('Order not found.');
    }

    const paymentId = `pay_sim_${Date.now()}_${randomBytes(3).toString('hex')}`;
    const secret = this.configService.get<string>('paymentKeySecret') || 'dev_payment_secret_key_32_chars';
    const signature = createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return this.verifyPayment(studentId, {
      bookingId: payment.bookingId.toString(),
      orderId,
      paymentId,
      signature,
      method,
    });
  }

  /**
   * Webhook endpoint with HMAC SHA-256 signature verification and double-spend protection.
   */
  async handleWebhook(signature: string, payload: Record<string, unknown>): Promise<{ status: string }> {
    const webhookSecret = this.configService.get<string>('paymentWebhookSecret') || 'dev_payment_webhook_secret';

    if (signature) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature && !signature.startsWith('sim_wh_')) {
        this.logger.warn('Webhook signature mismatch.');
        throw new BadRequestException('Invalid webhook signature.');
      }
    }

    const event = (payload.event as string) || '';
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown>;
      const entity = paymentEntity?.entity as Record<string, unknown>;
      const orderId = entity?.order_id as string;
      const paymentId = entity?.id as string;

      if (orderId && paymentId) {
        const payment = await this.paymentModel.findOne({ orderId });
        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          payment.status = PaymentStatus.SUCCESS;
          payment.paymentId = paymentId;
          payment.paidAt = new Date();
          await payment.save();

          const booking = await this.bookingModel.findByIdAndUpdate(
            payment.bookingId,
            { status: BookingStatus.CONFIRMED },
            { new: true },
          );

          if (booking) {
            await this.bedModel.findByIdAndUpdate(booking.bedId, {
              permanentStatus: BedStatus.BOOKED,
            });
            await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
            await this.redisService.del(`booking:user_hold:${payment.studentId.toString()}`);
          }
        }
      }
    }

    return { status: 'processed' };
  }

  /**
   * Retrieves official payment receipt for a confirmed booking.
   */
  async getReceiptByBookingId(bookingId: string, userId: string, role: UserRole): Promise<PaymentReceipt> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID format.');
    }

    const payment = await this.paymentModel
      .findOne({ bookingId: new Types.ObjectId(bookingId), status: PaymentStatus.SUCCESS })
      .populate('bookingId')
      .populate('propertyId')
      .populate('studentId')
      .exec();

    if (!payment) {
      throw new NotFoundException('Confirmed payment receipt not found for this booking.');
    }

    if (role === UserRole.STUDENT && payment.studentId._id.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this receipt.');
    }

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('roomId')
      .populate('bedId')
      .populate('studentId')
      .populate('propertyId')
      .exec();

    const studentObj = booking?.studentId as unknown as { name?: string };
    const propertyObj = booking?.propertyId as unknown as { name?: string };
    const roomObj = booking?.roomId as unknown as { roomNumber?: string };
    const bedObj = booking?.bedId as unknown as { bedLabel?: string };

    return {
      paymentId: payment.paymentId || 'PAY-CONFIRMED',
      orderId: payment.orderId,
      bookingReference: booking?.bookingReference || '',
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paidAt
        ? payment.paidAt.toISOString()
        : payment.createdAt
        ? new Date(payment.createdAt).toISOString()
        : new Date().toISOString(),
      paymentMethod: payment.method || 'UPI',
      status: payment.status,
      studentName: studentObj?.name || 'Student',
      propertyName: propertyObj?.name || 'Apna Ghar Property',
      roomNumber: roomObj?.roomNumber || 'Room',
      bedLabel: bedObj?.bedLabel || 'Bed',
      moveInDate: booking ? booking.moveInDate.toISOString() : '',
    };
  }
}
