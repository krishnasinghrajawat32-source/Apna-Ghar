"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("./bookings.service");
const booking_schema_1 = require("./schemas/booking.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const redis_service_1 = require("../../redis/redis.service");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('BookingsService', () => {
    let service;
    const mockStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockOtherStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockRoomTypeId = new mongoose_2.Types.ObjectId();
    const mockRoomId = new mongoose_2.Types.ObjectId();
    const mockBedId = new mongoose_2.Types.ObjectId();
    const mockBookingId = new mongoose_2.Types.ObjectId();
    const mockRoomType = {
        _id: mockRoomTypeId,
        name: 'Twin Sharing',
        baseRent: 8500,
        deposit: 8500,
    };
    const mockBedDoc = {
        _id: mockBedId,
        propertyId: mockPropertyId,
        roomId: mockRoomId,
        roomTypeId: mockRoomType,
        bedLabel: 'Bed 102-A',
        permanentStatus: shared_types_1.BedStatus.AVAILABLE,
    };
    const mockBookingDoc = {
        _id: mockBookingId,
        bookingReference: 'AG-20261018-ABCD',
        studentId: new mongoose_2.Types.ObjectId(mockStudentId),
        propertyId: mockPropertyId,
        roomTypeId: mockRoomTypeId,
        roomId: mockRoomId,
        bedId: mockBedId,
        moveInDate: new Date(Date.now() + 86400000 * 5),
        rentAmount: 8500,
        depositAmount: 8500,
        maintenanceFee: 0,
        moveInCharges: 0,
        totalInitialPayment: 17000,
        status: shared_types_1.BookingStatus.PENDING_PAYMENT,
        emergencyContact: {
            name: 'Rajesh Sharma',
            relationship: 'Father',
            phone: '9876543210',
        },
        save: jest.fn().mockResolvedValue(true),
    };
    const mockBookingModel = {
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
    };
    const mockBedModel = {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
    const mockPropertyModel = {
        find: jest.fn(),
        findById: jest.fn(),
    };
    const mockRedisService = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                bookings_service_1.BookingsService,
                {
                    provide: (0, mongoose_1.getModelToken)(booking_schema_1.Booking.name),
                    useValue: mockBookingModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(bed_schema_1.Bed.name),
                    useValue: mockBedModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: mockRedisService,
                },
            ],
        }).compile();
        service = module.get(bookings_service_1.BookingsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('calculateChargesPreview', () => {
        it('should calculate initial charges breakdown from bed roomType', async () => {
            mockBedModel.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBedDoc),
            });
            const breakdown = await service.calculateChargesPreview(mockBedId.toString());
            expect(breakdown.rentAmount).toBe(8500);
            expect(breakdown.depositAmount).toBe(8500);
            expect(breakdown.totalInitialPayment).toBe(17000);
        });
        it('should throw BadRequestException if bed ID format is invalid', async () => {
            await expect(service.calculateChargesPreview('invalid-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('createBooking', () => {
        const validDto = {
            bedId: mockBedId.toString(),
            moveInDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            emergencyContact: {
                name: 'Rajesh Sharma',
                relationship: 'Father',
                phone: '9876543210',
            },
        };
        it('should throw BadRequestException if move-in date is in the past', async () => {
            await expect(service.createBooking(mockStudentId, {
                ...validDto,
                moveInDate: '2020-01-01',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException if move-in date is > 60 days in advance', async () => {
            const farFuture = new Date(Date.now() + 86400000 * 90).toISOString();
            await expect(service.createBooking(mockStudentId, {
                ...validDto,
                moveInDate: farFuture,
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException if bed is not currently held in Redis', async () => {
            mockRedisService.get.mockResolvedValue(null);
            await expect(service.createBooking(mockStudentId, validDto)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw ForbiddenException if bed is held in Redis by another student', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({
                holdId: 'hold-123',
                studentId: mockOtherStudentId,
                bedId: mockBedId.toString(),
            }));
            await expect(service.createBooking(mockStudentId, validDto)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should create booking successfully with PENDING_PAYMENT status and reference', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({
                holdId: 'hold-123',
                studentId: mockStudentId,
                bedId: mockBedId.toString(),
            }));
            mockBedModel.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBedDoc),
            });
            mockBookingModel.findOne.mockResolvedValue(null); // No collision on reference
            mockBookingModel.create.mockResolvedValue(mockBookingDoc);
            mockBookingModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                exec: jest.fn().mockResolvedValue(mockBookingDoc),
                            }),
                        }),
                    }),
                }),
            });
            const result = await service.createBooking(mockStudentId, validDto);
            expect(result).toBeDefined();
            expect(mockBookingModel.create).toHaveBeenCalledWith(expect.objectContaining({
                studentId: new mongoose_2.Types.ObjectId(mockStudentId),
                status: shared_types_1.BookingStatus.PENDING_PAYMENT,
                rentAmount: 8500,
                depositAmount: 8500,
                totalInitialPayment: 17000,
            }));
            // Verify Redis hold was extended for payment window
            expect(mockRedisService.set).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`, expect.any(String), 900);
        });
    });
    describe('updateBookingStatus', () => {
        it('should allow student to cancel their own PENDING_PAYMENT booking and release Redis lock', async () => {
            mockBookingModel.findById.mockResolvedValue({
                ...mockBookingDoc,
                status: shared_types_1.BookingStatus.PENDING_PAYMENT,
                save: jest.fn().mockResolvedValue(true),
            });
            mockRedisService.del.mockResolvedValue(1);
            const result = await service.updateBookingStatus(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT, { status: shared_types_1.BookingStatus.CANCELLED, reason: 'Found accommodation elsewhere' });
            expect(result.status).toBe(shared_types_1.BookingStatus.CANCELLED);
            expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`);
        });
        it('should throw ForbiddenException if student attempts to confirm booking', async () => {
            mockBookingModel.findById.mockResolvedValue(mockBookingDoc);
            await expect(service.updateBookingStatus(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT, { status: shared_types_1.BookingStatus.CONFIRMED })).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('getBookingById', () => {
        it('should throw NotFoundException if booking does not exist', async () => {
            mockBookingModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                populate: jest.fn().mockReturnValue({
                                    exec: jest.fn().mockResolvedValue(null),
                                }),
                            }),
                        }),
                    }),
                }),
            });
            await expect(service.getBookingById(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getMoveInPass', () => {
        it('should throw BadRequestException if bookingId is invalid', async () => {
            await expect(service.getMoveInPass('invalid-id', mockStudentId, shared_types_1.UserRole.STUDENT)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if booking not found', async () => {
            mockBookingModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                populate: jest.fn().mockReturnValue({
                                    exec: jest.fn().mockResolvedValue(null),
                                }),
                            }),
                        }),
                    }),
                }),
            });
            await expect(service.getMoveInPass(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ForbiddenException if student does not own booking', async () => {
            const mockForeignDoc = {
                ...mockBookingDoc,
                studentId: new mongoose_2.Types.ObjectId(mockOtherStudentId),
            };
            mockBookingModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                populate: jest.fn().mockReturnValue({
                                    exec: jest.fn().mockResolvedValue(mockForeignDoc),
                                }),
                            }),
                        }),
                    }),
                }),
            });
            await expect(service.getMoveInPass(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should return complete MoveInPass with checklist and gate QR data', async () => {
            const populatedBookingDoc = {
                ...mockBookingDoc,
                status: shared_types_1.BookingStatus.CONFIRMED,
                studentId: {
                    _id: new mongoose_2.Types.ObjectId(mockStudentId),
                    name: 'Rohan Verma',
                    phone: '9876543210',
                },
                propertyId: {
                    _id: mockPropertyId,
                    name: 'Sunrise Boys Hostel',
                    address: {
                        street: '12 College Road',
                        city: 'Kota',
                        state: 'Rajasthan',
                        pincode: '324005',
                    },
                },
                roomId: {
                    _id: mockRoomId,
                    roomNumber: '102',
                },
                bedId: {
                    _id: mockBedId,
                    bedLabel: 'Bed 102-A',
                },
            };
            mockBookingModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            populate: jest.fn().mockReturnValue({
                                populate: jest.fn().mockReturnValue({
                                    exec: jest.fn().mockResolvedValue(populatedBookingDoc),
                                }),
                            }),
                        }),
                    }),
                }),
            });
            const pass = await service.getMoveInPass(mockBookingId.toString(), mockStudentId, shared_types_1.UserRole.STUDENT);
            expect(pass).toBeDefined();
            expect(pass.passNumber).toBe('PASS-AG-20261018-ABCD');
            expect(pass.studentName).toBe('Rohan Verma');
            expect(pass.roomNumber).toBe('102');
            expect(pass.bedLabel).toBe('Bed 102-A');
            expect(pass.checklist).toHaveLength(6);
            expect(pass.gatePassQrData).toContain('AG-GATEPASS');
            expect(pass.status).toBe('PENDING_CHECKIN');
        });
    });
});
//# sourceMappingURL=bookings.service.spec.js.map