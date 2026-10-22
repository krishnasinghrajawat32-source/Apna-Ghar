"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const payment_schema_1 = require("./schemas/payment.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const redis_service_1 = require("../../redis/redis.service");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('PaymentsService', () => {
    let service;
    const mockStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockOtherStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockBookingId = new mongoose_2.Types.ObjectId();
    const mockBedId = new mongoose_2.Types.ObjectId();
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockPaymentId = new mongoose_2.Types.ObjectId();
    const mockBookingDoc = {
        _id: mockBookingId,
        bookingReference: 'AG-20261018-TEST',
        studentId: new mongoose_2.Types.ObjectId(mockStudentId),
        propertyId: mockPropertyId,
        bedId: mockBedId,
        totalInitialPayment: 17000,
        status: shared_types_1.BookingStatus.PENDING_PAYMENT,
        moveInDate: new Date('2026-11-01'),
        roomId: { roomNumber: '101' },
    };
    const mockPaymentDoc = {
        _id: mockPaymentId,
        bookingId: mockBookingId,
        studentId: new mongoose_2.Types.ObjectId(mockStudentId),
        propertyId: mockPropertyId,
        orderId: 'order_sim_12345',
        amount: 17000,
        currency: 'INR',
        status: shared_types_1.PaymentStatus.INITIATED,
        receiptNumber: 'RCP-20261018-TEST',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
    };
    const mockPaymentModel = {
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
    const mockBookingModel = {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
    const mockBedModel = {
        findByIdAndUpdate: jest.fn(),
    };
    const mockRedisService = {
        del: jest.fn().mockResolvedValue(1),
    };
    const mockConfigService = {
        get: jest.fn((key) => {
            if (key === 'paymentKeySecret')
                return 'test_secret_key';
            if (key === 'paymentKeyId')
                return 'rzp_test_key_id';
            if (key === 'paymentWebhookSecret')
                return 'test_webhook_secret';
            return null;
        }),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                payments_service_1.PaymentsService,
                {
                    provide: (0, mongoose_1.getModelToken)(payment_schema_1.Payment.name),
                    useValue: mockPaymentModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(booking_schema_1.Booking.name),
                    useValue: mockBookingModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(bed_schema_1.Bed.name),
                    useValue: mockBedModel,
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: mockRedisService,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(payments_service_1.PaymentsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createOrder', () => {
        it('should throw NotFoundException if booking does not exist', async () => {
            mockBookingModel.findById.mockResolvedValue(null);
            await expect(service.createOrder(mockStudentId, { bookingId: mockBookingId.toString() })).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ForbiddenException if student does not own the booking', async () => {
            mockBookingModel.findById.mockResolvedValue(mockBookingDoc);
            await expect(service.createOrder(mockOtherStudentId, { bookingId: mockBookingId.toString() })).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should throw BadRequestException if booking is not in PENDING_PAYMENT status', async () => {
            mockBookingModel.findById.mockResolvedValue({
                ...mockBookingDoc,
                status: shared_types_1.BookingStatus.CONFIRMED,
            });
            await expect(service.createOrder(mockStudentId, { bookingId: mockBookingId.toString() })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should create payment order successfully and return order response', async () => {
            mockBookingModel.findById.mockResolvedValue(mockBookingDoc);
            mockPaymentModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null),
            });
            mockPaymentModel.create.mockResolvedValue(mockPaymentDoc);
            const order = await service.createOrder(mockStudentId, { bookingId: mockBookingId.toString() });
            expect(order).toBeDefined();
            expect(order.amount).toBe(17000);
            expect(order.currency).toBe('INR');
            expect(order.bookingReference).toBe('AG-20261018-TEST');
            expect(mockPaymentModel.create).toHaveBeenCalled();
        });
    });
    describe('verifyPayment', () => {
        it('should confirm payment, update booking and bed to BOOKED, and release Redis lock', async () => {
            const activePayment = {
                ...mockPaymentDoc,
                status: shared_types_1.PaymentStatus.INITIATED,
                save: jest.fn().mockResolvedValue(true),
            };
            mockPaymentModel.findOne.mockResolvedValue(activePayment);
            mockBookingModel.findByIdAndUpdate.mockResolvedValue({
                ...mockBookingDoc,
                status: shared_types_1.BookingStatus.CONFIRMED,
            });
            mockBedModel.findByIdAndUpdate.mockResolvedValue(true);
            const result = await service.verifyPayment(mockStudentId, {
                bookingId: mockBookingId.toString(),
                orderId: 'order_sim_12345',
                paymentId: 'pay_sim_99999',
                signature: 'valid_sig',
            });
            expect(result.success).toBe(true);
            expect(activePayment.status).toBe(shared_types_1.PaymentStatus.SUCCESS);
            expect(mockBedModel.findByIdAndUpdate).toHaveBeenCalledWith(mockBedId, {
                permanentStatus: shared_types_1.BedStatus.BOOKED,
            });
            expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`);
        });
        it('should be idempotent and return existing success if already verified (double-spend protection)', async () => {
            mockPaymentModel.findOne.mockResolvedValue({
                ...mockPaymentDoc,
                status: shared_types_1.PaymentStatus.SUCCESS,
            });
            mockBookingModel.findById.mockResolvedValue(mockBookingDoc);
            const result = await service.verifyPayment(mockStudentId, {
                bookingId: mockBookingId.toString(),
                orderId: 'order_sim_12345',
                paymentId: 'pay_sim_99999',
                signature: 'valid_sig',
            });
            expect(result.success).toBe(true);
            expect(mockBedModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });
    });
    describe('simulatePayment', () => {
        it('should generate simulated HMAC signature and confirm payment', async () => {
            const activePayment = {
                ...mockPaymentDoc,
                status: shared_types_1.PaymentStatus.INITIATED,
                save: jest.fn().mockResolvedValue(true),
            };
            mockPaymentModel.findOne.mockResolvedValue(activePayment);
            mockBookingModel.findByIdAndUpdate.mockResolvedValue(mockBookingDoc);
            mockBedModel.findByIdAndUpdate.mockResolvedValue(true);
            const result = await service.simulatePayment(mockStudentId, 'order_sim_12345', 'UPI');
            expect(result.success).toBe(true);
            expect(activePayment.status).toBe(shared_types_1.PaymentStatus.SUCCESS);
        });
    });
    describe('handleWebhook', () => {
        it('should process payment.captured event and confirm booking', async () => {
            const activePayment = {
                ...mockPaymentDoc,
                status: shared_types_1.PaymentStatus.INITIATED,
                save: jest.fn().mockResolvedValue(true),
            };
            mockPaymentModel.findOne.mockResolvedValue(activePayment);
            mockBookingModel.findByIdAndUpdate.mockResolvedValue(mockBookingDoc);
            mockBedModel.findByIdAndUpdate.mockResolvedValue(true);
            const result = await service.handleWebhook('sim_wh_sig', {
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_wh_12345',
                            order_id: 'order_sim_12345',
                            amount: 1700000,
                        },
                    },
                },
            });
            expect(result.status).toBe('processed');
            expect(activePayment.status).toBe(shared_types_1.PaymentStatus.SUCCESS);
        });
    });
    describe('getReceiptByBookingId', () => {
        it('should throw NotFoundException if receipt does not exist', async () => {
            mockPaymentModel.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            exec: jest.fn().mockResolvedValue(null),
                        }),
                    }),
                }),
            });
            await expect(service.getReceiptByBookingId(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=payments.service.spec.js.map