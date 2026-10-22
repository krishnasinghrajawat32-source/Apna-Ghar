import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UserRole, PaymentOrderResponse, PaymentReceipt } from '@apna-ghar/shared-types';
import { PaymentDocument } from './schemas/payment.schema';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { BedDocument } from '../inventory/schemas/bed.schema';
import { CreatePaymentOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RedisService } from '../../redis/redis.service';
export declare class PaymentsService {
    private readonly paymentModel;
    private readonly bookingModel;
    private readonly bedModel;
    private readonly redisService;
    private readonly configService;
    private readonly logger;
    constructor(paymentModel: Model<PaymentDocument>, bookingModel: Model<BookingDocument>, bedModel: Model<BedDocument>, redisService: RedisService, configService: ConfigService);
    private generateReceiptNumber;
    /**
     * Creates an order with the payment gateway or test simulator.
     */
    createOrder(studentId: string, dto: CreatePaymentOrderDto): Promise<PaymentOrderResponse>;
    /**
     * Verifies payment gateway signature and applies atomic double-spend protected confirmation.
     */
    verifyPayment(studentId: string, dto: VerifyPaymentDto): Promise<{
        success: boolean;
        payment: PaymentDocument;
        bookingReference: string;
    }>;
    /**
     * Helper simulator for local development and end-to-end tests.
     */
    simulatePayment(studentId: string, orderId: string, method?: 'UPI' | 'NETBANKING' | 'CARD' | 'SIMULATOR'): Promise<{
        success: boolean;
        payment: PaymentDocument;
        bookingReference: string;
    }>;
    /**
     * Webhook endpoint with HMAC SHA-256 signature verification and double-spend protection.
     */
    handleWebhook(signature: string, payload: Record<string, unknown>): Promise<{
        status: string;
    }>;
    /**
     * Retrieves official payment receipt for a confirmed booking.
     */
    getReceiptByBookingId(bookingId: string, userId: string, role: UserRole): Promise<PaymentReceipt>;
}
//# sourceMappingURL=payments.service.d.ts.map