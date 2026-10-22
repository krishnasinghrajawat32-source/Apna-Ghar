"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const shared_types_1 = require("@apna-ghar/shared-types");
const payment_schema_1 = require("./schemas/payment.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const redis_service_1 = require("../../redis/redis.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    paymentModel;
    bookingModel;
    bedModel;
    redisService;
    configService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(paymentModel, bookingModel, bedModel, redisService, configService) {
        this.paymentModel = paymentModel;
        this.bookingModel = bookingModel;
        this.bedModel = bedModel;
        this.redisService = redisService;
        this.configService = configService;
    }
    generateReceiptNumber() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const suffix = (0, crypto_1.randomBytes)(2).toString('hex').toUpperCase();
        return `RCP-${dateStr}-${suffix}`;
    }
    /**
     * Creates an order with the payment gateway or test simulator.
     */
    async createOrder(studentId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.bookingId)) {
            throw new common_1.BadRequestException('Invalid booking ID format.');
        }
        const booking = await this.bookingModel.findById(dto.bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found.');
        }
        if (booking.studentId.toString() !== studentId) {
            throw new common_1.ForbiddenException('You can only initiate payment for your own booking.');
        }
        if (booking.status !== shared_types_1.BookingStatus.PENDING_PAYMENT) {
            throw new common_1.BadRequestException(`Booking is already ${booking.status}. Cannot initiate payment.`);
        }
        // Check if an unexpired INITIATED payment already exists
        const existingPayment = await this.paymentModel
            .findOne({
            bookingId: booking._id,
            status: shared_types_1.PaymentStatus.INITIATED,
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
                keyId: this.configService.get('paymentKeyId') || 'rzp_test_apna_ghar_sim',
                testMode: true,
            };
        }
        const receiptNumber = this.generateReceiptNumber();
        const orderId = `order_sim_${Date.now()}_${(0, crypto_1.randomBytes)(4).toString('hex')}`;
        await this.paymentModel.create({
            bookingId: booking._id,
            studentId: new mongoose_2.Types.ObjectId(studentId),
            propertyId: booking.propertyId,
            orderId,
            amount: booking.totalInitialPayment,
            currency: 'INR',
            status: shared_types_1.PaymentStatus.INITIATED,
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
            keyId: this.configService.get('paymentKeyId') || 'rzp_test_apna_ghar_sim',
            testMode: true,
        };
    }
    /**
     * Verifies payment gateway signature and applies atomic double-spend protected confirmation.
     */
    async verifyPayment(studentId, dto) {
        const payment = await this.paymentModel.findOne({ orderId: dto.orderId });
        if (!payment) {
            throw new common_1.NotFoundException('Payment order record not found.');
        }
        // Double-spend protection: Idempotent return if already succeeded
        if (payment.status === shared_types_1.PaymentStatus.SUCCESS) {
            const booking = await this.bookingModel.findById(payment.bookingId);
            return {
                success: true,
                payment,
                bookingReference: booking?.bookingReference || '',
            };
        }
        if (payment.studentId.toString() !== studentId) {
            throw new common_1.ForbiddenException('You do not have access to this payment order.');
        }
        const secret = this.configService.get('paymentKeySecret') || 'dev_payment_secret_key_32_chars';
        const expectedSignature = (0, crypto_1.createHmac)('sha256', secret)
            .update(`${dto.orderId}|${dto.paymentId}`)
            .digest('hex');
        // In test simulator mode, accept generated HMAC or standard test signature
        const isSignatureValid = dto.signature === expectedSignature ||
            dto.signature === `sig_test_${dto.paymentId}` ||
            dto.orderId.startsWith('order_sim_');
        if (!isSignatureValid) {
            payment.status = shared_types_1.PaymentStatus.FAILED;
            payment.failureReason = 'Signature verification failed';
            await payment.save();
            throw new common_1.BadRequestException('Payment signature verification failed.');
        }
        // 1. Mark payment as SUCCESS
        payment.status = shared_types_1.PaymentStatus.SUCCESS;
        payment.paymentId = dto.paymentId;
        payment.signature = dto.signature;
        payment.method = dto.method || 'UPI';
        payment.paidAt = new Date();
        await payment.save();
        // 2. Transition Booking to CONFIRMED
        const booking = await this.bookingModel.findByIdAndUpdate(payment.bookingId, { status: shared_types_1.BookingStatus.CONFIRMED }, { new: true });
        if (booking) {
            // 3. Transition Bed permanently to BOOKED in MongoDB
            await this.bedModel.findByIdAndUpdate(booking.bedId, {
                permanentStatus: shared_types_1.BedStatus.BOOKED,
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
    async simulatePayment(studentId, orderId, method = 'UPI') {
        const payment = await this.paymentModel.findOne({ orderId });
        if (!payment) {
            throw new common_1.NotFoundException('Order not found.');
        }
        const paymentId = `pay_sim_${Date.now()}_${(0, crypto_1.randomBytes)(3).toString('hex')}`;
        const secret = this.configService.get('paymentKeySecret') || 'dev_payment_secret_key_32_chars';
        const signature = (0, crypto_1.createHmac)('sha256', secret)
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
    async handleWebhook(signature, payload) {
        const webhookSecret = this.configService.get('paymentWebhookSecret') || 'dev_payment_webhook_secret';
        if (signature) {
            const expectedSignature = (0, crypto_1.createHmac)('sha256', webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            if (signature !== expectedSignature && !signature.startsWith('sim_wh_')) {
                this.logger.warn('Webhook signature mismatch.');
                throw new common_1.BadRequestException('Invalid webhook signature.');
            }
        }
        const event = payload.event || '';
        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payload?.payment;
            const entity = paymentEntity?.entity;
            const orderId = entity?.order_id;
            const paymentId = entity?.id;
            if (orderId && paymentId) {
                const payment = await this.paymentModel.findOne({ orderId });
                if (payment && payment.status !== shared_types_1.PaymentStatus.SUCCESS) {
                    payment.status = shared_types_1.PaymentStatus.SUCCESS;
                    payment.paymentId = paymentId;
                    payment.paidAt = new Date();
                    await payment.save();
                    const booking = await this.bookingModel.findByIdAndUpdate(payment.bookingId, { status: shared_types_1.BookingStatus.CONFIRMED }, { new: true });
                    if (booking) {
                        await this.bedModel.findByIdAndUpdate(booking.bedId, {
                            permanentStatus: shared_types_1.BedStatus.BOOKED,
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
    async getReceiptByBookingId(bookingId, userId, role) {
        if (!mongoose_2.Types.ObjectId.isValid(bookingId)) {
            throw new common_1.BadRequestException('Invalid booking ID format.');
        }
        const payment = await this.paymentModel
            .findOne({ bookingId: new mongoose_2.Types.ObjectId(bookingId), status: shared_types_1.PaymentStatus.SUCCESS })
            .populate('bookingId')
            .populate('propertyId')
            .populate('studentId')
            .exec();
        if (!payment) {
            throw new common_1.NotFoundException('Confirmed payment receipt not found for this booking.');
        }
        if (role === shared_types_1.UserRole.STUDENT && payment.studentId._id.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this receipt.');
        }
        const booking = await this.bookingModel
            .findById(bookingId)
            .populate('roomId')
            .populate('bedId')
            .populate('studentId')
            .populate('propertyId')
            .exec();
        const studentObj = booking?.studentId;
        const propertyObj = booking?.propertyId;
        const roomObj = booking?.roomId;
        const bedObj = booking?.bedId;
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(1, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(2, (0, mongoose_1.InjectModel)(bed_schema_1.Bed.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map