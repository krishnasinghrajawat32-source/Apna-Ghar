import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  BookingStatus,
  BedStatus,
  UserRole,
  BookingChargeBreakdown,
} from '@apna-ghar/shared-types';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Bed, BedDocument } from '../inventory/schemas/bed.schema';
import { RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generates a unique human-readable booking reference formatted as AG-YYYYMMDD-XXXX.
   */
  private generateBookingReference(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = randomBytes(2).toString('hex').toUpperCase();
    return `AG-${dateStr}-${randomSuffix}`;
  }

  /**
   * Calculates itemized initial payment charges for a bed / room type.
   */
  async calculateChargesPreview(bedId: string): Promise<BookingChargeBreakdown> {
    if (!Types.ObjectId.isValid(bedId)) {
      throw new BadRequestException('Invalid bed ID format.');
    }

    const bed = await this.bedModel.findById(bedId).populate<{ roomTypeId: RoomTypeDocument }>('roomTypeId');
    if (!bed) {
      throw new NotFoundException('Bed not found.');
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
  async createBooking(studentId: string, dto: CreateBookingDto): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(dto.bedId)) {
      throw new BadRequestException('Invalid bed ID format.');
    }

    // 1. Move-in date validation
    const moveInDate = new Date(dto.moveInDate);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (isNaN(moveInDate.getTime())) {
      throw new BadRequestException('Invalid move-in date format.');
    }

    if (moveInDate < todayStart) {
      throw new BadRequestException('Move-in date cannot be in the past.');
    }

    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 60);
    if (moveInDate > maxAdvanceDate) {
      throw new BadRequestException('Move-in date cannot be more than 60 days in advance.');
    }

    // 2. Validate Redis Temporary Hold ownership
    const holdKey = `booking:hold:${dto.bedId}`;
    const holdRaw = await this.redisService.get(holdKey);

    if (!holdRaw) {
      throw new BadRequestException(
        'You do not have an active reservation hold on this bed. Please select and hold the bed before booking.',
      );
    }

    try {
      const holdPayload = JSON.parse(holdRaw);
      if (holdPayload.studentId !== studentId) {
        throw new ForbiddenException('This bed reservation is held by another student.');
      }
    } catch (err: unknown) {
      if (err instanceof ForbiddenException) throw err;
      throw new BadRequestException('Invalid bed hold state.');
    }

    // 3. Look up Bed and hierarchy
    const bed = await this.bedModel
      .findById(dto.bedId)
      .populate<{ roomTypeId: RoomTypeDocument }>('roomTypeId');

    if (!bed) {
      throw new NotFoundException('Bed not found.');
    }

    if (bed.permanentStatus !== BedStatus.AVAILABLE) {
      throw new BadRequestException('This bed is not available for booking.');
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
      studentId: new Types.ObjectId(studentId),
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
      status: BookingStatus.PENDING_PAYMENT,
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
  async getBookingById(bookingId: string, userId: string, role: UserRole): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID format.');
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
      throw new NotFoundException('Booking not found.');
    }

    // RBAC: Students can only view their own bookings
    if (role === UserRole.STUDENT && booking.studentId._id.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this booking.');
    }

    return booking;
  }

  /**
   * Retrieves all bookings for a student.
   */
  async getStudentBookings(studentId: string): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({ studentId: new Types.ObjectId(studentId) })
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
  async getOwnerBookings(ownerId: string): Promise<BookingDocument[]> {
    const properties = await this.propertyModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
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
  async updateBookingStatus(
    bookingId: string,
    userId: string,
    role: UserRole,
    dto: UpdateBookingStatusDto,
  ): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID format.');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    // Cancellation authorization
    if (dto.status === BookingStatus.CANCELLED) {
      if (role === UserRole.STUDENT && booking.studentId.toString() !== userId) {
        throw new ForbiddenException('You do not have permission to cancel this booking.');
      }
      booking.status = BookingStatus.CANCELLED;
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
    if (role === UserRole.STUDENT) {
      throw new ForbiddenException('Students cannot directly modify booking lifecycle status.');
    }

    booking.status = dto.status;
    if (dto.reason) {
      booking.cancelledReason = dto.reason;
    }

    // If confirmed, update bed permanentStatus to BOOKED
    if (dto.status === BookingStatus.CONFIRMED) {
      await this.bedModel.findByIdAndUpdate(booking.bedId, {
        permanentStatus: BedStatus.BOOKED,
      });
      // Clear Redis hold since bed is now permanently booked
      await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
      await this.redisService.del(`booking:user_hold:${booking.studentId.toString()}`);
    }

    await booking.save();
    return booking;
  }
}
