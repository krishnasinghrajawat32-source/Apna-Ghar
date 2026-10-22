import { Model } from 'mongoose';
import { UserRole, BookingChargeBreakdown, MoveInPass } from '@apna-ghar/shared-types';
import { BookingDocument } from './schemas/booking.schema';
import { BedDocument } from '../inventory/schemas/bed.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { RedisService } from '../../redis/redis.service';
export declare class BookingsService {
    private readonly bookingModel;
    private readonly bedModel;
    private readonly propertyModel;
    private readonly redisService;
    private readonly logger;
    constructor(bookingModel: Model<BookingDocument>, bedModel: Model<BedDocument>, propertyModel: Model<PropertyDocument>, redisService: RedisService);
    /**
     * Generates a unique human-readable booking reference formatted as AG-YYYYMMDD-XXXX.
     */
    private generateBookingReference;
    /**
     * Calculates itemized initial payment charges for a bed / room type.
     */
    calculateChargesPreview(bedId: string): Promise<BookingChargeBreakdown>;
    /**
     * Creates a formal booking from an active temporary Redis bed hold.
     */
    createBooking(studentId: string, dto: CreateBookingDto): Promise<BookingDocument>;
    /**
     * Retrieves single booking by ID with ownership guard.
     */
    getBookingById(bookingId: string, userId: string, role: UserRole): Promise<BookingDocument>;
    /**
     * Retrieves all bookings for a student.
     */
    getStudentBookings(studentId: string): Promise<BookingDocument[]>;
    /**
     * Retrieves all bookings for an owner across all their properties.
     */
    getOwnerBookings(ownerId: string): Promise<BookingDocument[]>;
    /**
     * Updates booking lifecycle status.
     */
    updateBookingStatus(bookingId: string, userId: string, role: UserRole, dto: UpdateBookingStatusDto): Promise<BookingDocument>;
    /**
     * Generates a digital move-in gate pass with 6-point inventory verification checklist.
     */
    getMoveInPass(bookingId: string, userId: string, role: UserRole): Promise<MoveInPass>;
}
//# sourceMappingURL=bookings.service.d.ts.map