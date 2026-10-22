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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const shared_types_1 = require("@apna-ghar/shared-types");
const booking_schema_1 = require("./schemas/booking.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const redis_service_1 = require("../../redis/redis.service");
let BookingsService = BookingsService_1 = class BookingsService {
    bookingModel;
    bedModel;
    propertyModel;
    redisService;
    logger = new common_1.Logger(BookingsService_1.name);
    constructor(bookingModel, bedModel, propertyModel, redisService) {
        this.bookingModel = bookingModel;
        this.bedModel = bedModel;
        this.propertyModel = propertyModel;
        this.redisService = redisService;
    }
    /**
     * Generates a unique human-readable booking reference formatted as AG-YYYYMMDD-XXXX.
     */
    generateBookingReference() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = (0, crypto_1.randomBytes)(2).toString('hex').toUpperCase();
        return `AG-${dateStr}-${randomSuffix}`;
    }
    /**
     * Calculates itemized initial payment charges for a bed / room type.
     */
    async calculateChargesPreview(bedId) {
        if (!mongoose_2.Types.ObjectId.isValid(bedId)) {
            throw new common_1.BadRequestException('Invalid bed ID format.');
        }
        const bed = await this.bedModel.findById(bedId).populate('roomTypeId');
        if (!bed) {
            throw new common_1.NotFoundException('Bed not found.');
        }
        const roomType = bed.roomTypeId;
        const rentAmount = roomType.baseRent;
        const depositAmount = roomType.deposit;
        const maintenanceFee = 0; // Transparent zero hidden fees
        const moveInCharges = 0;
        const totalInitialPayment = rentAmount + depositAmount + maintenanceFee + moveInCharges;
        return {
            rentAmount,
            depositAmount,
            maintenanceFee,
            moveInCharges,
            totalInitialPayment,
        };
    }
    /**
     * Creates a formal booking from an active temporary Redis bed hold.
     */
    async createBooking(studentId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.bedId)) {
            throw new common_1.BadRequestException('Invalid bed ID format.');
        }
        // 1. Move-in date validation
        const moveInDate = new Date(dto.moveInDate);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (isNaN(moveInDate.getTime())) {
            throw new common_1.BadRequestException('Invalid move-in date format.');
        }
        if (moveInDate < todayStart) {
            throw new common_1.BadRequestException('Move-in date cannot be in the past.');
        }
        const maxAdvanceDate = new Date();
        maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 60);
        if (moveInDate > maxAdvanceDate) {
            throw new common_1.BadRequestException('Move-in date cannot be more than 60 days in advance.');
        }
        // 2. Validate Redis Temporary Hold ownership
        const holdKey = `booking:hold:${dto.bedId}`;
        const holdRaw = await this.redisService.get(holdKey);
        if (!holdRaw) {
            throw new common_1.BadRequestException('You do not have an active reservation hold on this bed. Please select and hold the bed before booking.');
        }
        try {
            const holdPayload = JSON.parse(holdRaw);
            if (holdPayload.studentId !== studentId) {
                throw new common_1.ForbiddenException('This bed reservation is held by another student.');
            }
        }
        catch (err) {
            if (err instanceof common_1.ForbiddenException)
                throw err;
            throw new common_1.BadRequestException('Invalid bed hold state.');
        }
        // 3. Look up Bed and hierarchy
        const bed = await this.bedModel
            .findById(dto.bedId)
            .populate('roomTypeId');
        if (!bed) {
            throw new common_1.NotFoundException('Bed not found.');
        }
        if (bed.permanentStatus !== shared_types_1.BedStatus.AVAILABLE) {
            throw new common_1.BadRequestException('This bed is not available for booking.');
        }
        const roomType = bed.roomTypeId;
        const rentAmount = roomType.baseRent;
        const depositAmount = roomType.deposit;
        const maintenanceFee = 0;
        const moveInCharges = 0;
        const totalInitialPayment = rentAmount + depositAmount + maintenanceFee + moveInCharges;
        // 4. Generate unique booking reference with retry on collision
        let bookingReference = this.generateBookingReference();
        let collisionCheck = await this.bookingModel.findOne({ bookingReference });
        while (collisionCheck) {
            bookingReference = this.generateBookingReference();
            collisionCheck = await this.bookingModel.findOne({ bookingReference });
        }
        // 5. Create Booking in MongoDB
        const booking = await this.bookingModel.create({
            bookingReference,
            studentId: new mongoose_2.Types.ObjectId(studentId),
            propertyId: bed.propertyId,
            roomTypeId: bed.roomTypeId._id || bed.roomTypeId,
            roomId: bed.roomId,
            bedId: bed._id,
            moveInDate,
            rentAmount,
            depositAmount,
            maintenanceFee,
            moveInCharges,
            totalInitialPayment,
            status: shared_types_1.BookingStatus.PENDING_PAYMENT,
            emergencyContact: dto.emergencyContact,
            studentIdCardRef: dto.studentIdCardRef || null,
        });
        // Extend Redis bed hold TTL to 15 minutes (900 seconds) to allow student time to complete payment
        await this.redisService.set(holdKey, holdRaw, 900);
        await this.redisService.set(`booking:user_hold:${studentId}`, dto.bedId, 900);
        this.logger.log(`Booking created: ${booking.bookingReference} for student ${studentId} (bed: ${dto.bedId})`);
        const populatedBooking = await this.bookingModel
            .findById(booking._id)
            .populate('propertyId')
            .populate('roomTypeId')
            .populate('roomId')
            .populate('bedId')
            .exec();
        return populatedBooking || booking;
    }
    /**
     * Retrieves single booking by ID with ownership guard.
     */
    async getBookingById(bookingId, userId, role) {
        if (!mongoose_2.Types.ObjectId.isValid(bookingId)) {
            throw new common_1.BadRequestException('Invalid booking ID format.');
        }
        const booking = await this.bookingModel
            .findById(bookingId)
            .populate('propertyId')
            .populate('roomTypeId')
            .populate('roomId')
            .populate('bedId')
            .populate('studentId', 'name email phone')
            .exec();
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found.');
        }
        // RBAC: Students can only view their own bookings
        if (role === shared_types_1.UserRole.STUDENT && booking.studentId._id.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this booking.');
        }
        return booking;
    }
    /**
     * Retrieves all bookings for a student.
     */
    async getStudentBookings(studentId) {
        return this.bookingModel
            .find({ studentId: new mongoose_2.Types.ObjectId(studentId) })
            .populate('propertyId')
            .populate('roomTypeId')
            .populate('roomId')
            .populate('bedId')
            .sort({ createdAt: -1 })
            .exec();
    }
    /**
     * Retrieves all bookings for an owner across all their properties.
     */
    async getOwnerBookings(ownerId) {
        const properties = await this.propertyModel
            .find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) })
            .select('_id')
            .exec();
        const propertyIds = properties.map((p) => p._id);
        return this.bookingModel
            .find({ propertyId: { $in: propertyIds } })
            .populate('propertyId')
            .populate('roomTypeId')
            .populate('roomId')
            .populate('bedId')
            .populate('studentId', 'name email phone')
            .sort({ createdAt: -1 })
            .exec();
    }
    /**
     * Updates booking lifecycle status.
     */
    async updateBookingStatus(bookingId, userId, role, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(bookingId)) {
            throw new common_1.BadRequestException('Invalid booking ID format.');
        }
        const booking = await this.bookingModel.findById(bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found.');
        }
        // Cancellation authorization
        if (dto.status === shared_types_1.BookingStatus.CANCELLED) {
            if (role === shared_types_1.UserRole.STUDENT && booking.studentId.toString() !== userId) {
                throw new common_1.ForbiddenException('You do not have permission to cancel this booking.');
            }
            booking.status = shared_types_1.BookingStatus.CANCELLED;
            booking.cancelledReason = dto.reason || 'Cancelled by student';
            booking.cancellationDate = new Date();
            // Release Redis temporary hold
            await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
            await this.redisService.del(`booking:user_hold:${booking.studentId.toString()}`);
            await booking.save();
            this.logger.log(`Booking ${booking.bookingReference} cancelled by user ${userId}`);
            return booking;
        }
        // Only OWNER or ADMIN can confirm or complete bookings
        if (role === shared_types_1.UserRole.STUDENT) {
            throw new common_1.ForbiddenException('Students cannot directly modify booking lifecycle status.');
        }
        booking.status = dto.status;
        if (dto.reason) {
            booking.cancelledReason = dto.reason;
        }
        // If confirmed, update bed permanentStatus to BOOKED
        if (dto.status === shared_types_1.BookingStatus.CONFIRMED) {
            await this.bedModel.findByIdAndUpdate(booking.bedId, {
                permanentStatus: shared_types_1.BedStatus.BOOKED,
            });
            // Clear Redis hold since bed is now permanently booked
            await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
            await this.redisService.del(`booking:user_hold:${booking.studentId.toString()}`);
        }
        await booking.save();
        return booking;
    }
    /**
     * Generates a digital move-in gate pass with 6-point inventory verification checklist.
     */
    async getMoveInPass(bookingId, userId, role) {
        if (!mongoose_2.Types.ObjectId.isValid(bookingId)) {
            throw new common_1.BadRequestException('Invalid booking ID format.');
        }
        const booking = await this.bookingModel
            .findById(bookingId)
            .populate('propertyId')
            .populate('roomTypeId')
            .populate('roomId')
            .populate('bedId')
            .populate('studentId')
            .exec();
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found.');
        }
        const bookingStudentId = booking.studentId?._id?.toString() ||
            booking.studentId?.toString();
        if (role === shared_types_1.UserRole.STUDENT && bookingStudentId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to access this move-in pass.');
        }
        const property = booking.propertyId;
        const room = booking.roomId;
        const bed = booking.bedId;
        const student = booking.studentId;
        const propertyAddressStr = property?.address
            ? `${property.address.street}, ${property.address.city}, ${property.address.state} - ${property.address.pincode}`
            : 'Address on file';
        const checklist = [
            {
                id: 'chk-1',
                label: 'Bed Frame & Sanitized High-Density Mattress Condition',
                verified: true,
                notes: 'Clean and certified ready',
            },
            {
                id: 'chk-2',
                label: 'Study Desk, Ergonomic Chair & Wardrobe Storage Keys',
                verified: true,
                notes: 'Keys tagged and ready for handover',
            },
            {
                id: 'chk-3',
                label: 'Electrical Fixtures, Ceiling Fan, Lighting & Power Sockets',
                verified: true,
                notes: 'Voltage and load tested',
            },
            {
                id: 'chk-4',
                label: 'High-Speed Wi-Fi Router & Secure Mesh SSID Access',
                verified: true,
                notes: 'Credentials provided upon check-in',
            },
            {
                id: 'chk-5',
                label: 'Bathroom Plumbing, Geyser & Continuous Water Supply',
                verified: true,
                notes: 'Functional hot water and pressure verified',
            },
            {
                id: 'chk-6',
                label: 'Main Gate Biometric Registration / Smart NFC Access Keycard',
                verified: true,
                notes: 'Handover at reception desk upon verification',
            },
        ];
        const passStatus = booking.status === shared_types_1.BookingStatus.COMPLETED ? 'CHECKED_IN' : 'PENDING_CHECKIN';
        const gatePassQrData = `AG-GATEPASS:${booking.bookingReference}:${bed?._id?.toString() || ''}:${student?._id?.toString() || ''}`;
        return {
            passNumber: `PASS-${booking.bookingReference}`,
            bookingReference: booking.bookingReference,
            studentName: student?.name || 'Student',
            studentPhone: student?.phone || '',
            propertyName: property?.name || 'Apna Ghar Property',
            propertyAddress: propertyAddressStr,
            roomNumber: room?.roomNumber || 'TBD',
            bedLabel: bed?.bedLabel || 'TBD',
            moveInDate: booking.moveInDate ? booking.moveInDate.toISOString() : new Date().toISOString(),
            gatePassQrData,
            checklist,
            status: passStatus,
        };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(1, (0, mongoose_1.InjectModel)(bed_schema_1.Bed.name)),
    __param(2, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map