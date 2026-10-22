import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UserRole } from '@apna-ghar/shared-types';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    previewCharges(bedId: string): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").BookingChargeBreakdown;
    }>;
    createBooking(studentId: string, dto: CreateBookingDto): Promise<{
        success: boolean;
        data: import("./schemas/booking.schema").BookingDocument;
    }>;
    getStudentBookings(studentId: string): Promise<{
        success: boolean;
        data: import("./schemas/booking.schema").BookingDocument[];
    }>;
    getOwnerBookings(ownerId: string): Promise<{
        success: boolean;
        data: import("./schemas/booking.schema").BookingDocument[];
    }>;
    getBookingById(bookingId: string, userId: string, role: UserRole): Promise<{
        success: boolean;
        data: import("./schemas/booking.schema").BookingDocument;
    }>;
    getMoveInPass(bookingId: string, userId: string, role: UserRole): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").MoveInPass;
    }>;
    updateBookingStatus(bookingId: string, userId: string, role: UserRole, dto: UpdateBookingStatusDto): Promise<{
        success: boolean;
        data: import("./schemas/booking.schema").BookingDocument;
    }>;
}
//# sourceMappingURL=bookings.controller.d.ts.map