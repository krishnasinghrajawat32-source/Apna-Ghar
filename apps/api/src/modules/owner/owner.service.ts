import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  OwnerOverviewMetrics,
  OwnerPropertySummary,
  BedStatus,
  BookingStatus,
  VisitStatus,
  UserRole,
  PropertyStatus,
  ApprovalStatus,
} from '@apna-ghar/shared-types';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Room, RoomDocument } from '../inventory/schemas/room.schema';
import { Bed, BedDocument } from '../inventory/schemas/bed.schema';
import { RoomType, RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema';
import { OwnerProfile, OwnerProfileDocument } from '../users/schemas/owner-profile.schema';
import { RedisService } from '../../redis/redis.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateBedDto } from './dto/create-bed.dto';
import { BookingDecisionDto } from './dto/booking-decision.dto';
import { UpdateOwnerProfileDto } from './dto/update-owner-profile.dto';

@Injectable()
export class OwnerService {
  private readonly logger = new Logger(OwnerService.name);

  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(OwnerProfile.name) private readonly ownerProfileModel: Model<OwnerProfileDocument>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Calculates aggregated portfolio performance metrics for an owner.
   */
  async getOverview(ownerId: string): Promise<OwnerOverviewMetrics> {
    const properties = await this.propertyModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .select('_id')
      .exec();

    const propertyIds = properties.map((p) => p._id);

    if (propertyIds.length === 0) {
      return {
        totalProperties: 0,
        totalRooms: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        maintenanceBeds: 0,
        occupancyRate: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        pendingVisits: 0,
        openTickets: 0,
      };
    }

    const [
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      totalBookings,
      confirmedBookings,
      pendingVisits,
      openTickets,
    ] = await Promise.all([
      this.roomModel.countDocuments({ propertyId: { $in: propertyIds } }),
      this.bedModel.countDocuments({ propertyId: { $in: propertyIds } }),
      this.bedModel.countDocuments({
        propertyId: { $in: propertyIds },
        permanentStatus: BedStatus.BOOKED,
      }),
      this.bedModel.countDocuments({
        propertyId: { $in: propertyIds },
        permanentStatus: BedStatus.AVAILABLE,
      }),
      this.bedModel.countDocuments({
        propertyId: { $in: propertyIds },
        permanentStatus: BedStatus.MAINTENANCE,
      }),
      this.bookingModel.countDocuments({ propertyId: { $in: propertyIds } }),
      this.bookingModel.countDocuments({
        propertyId: { $in: propertyIds },
        status: BookingStatus.CONFIRMED,
      }),
      this.visitModel.countDocuments({
        propertyId: { $in: propertyIds },
        status: VisitStatus.REQUESTED,
      }),
      this.ticketModel.countDocuments({
        propertyId: { $in: propertyIds },
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
      }),
    ]);

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalProperties: propertyIds.length,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyRate,
      totalBookings,
      confirmedBookings,
      pendingVisits,
      openTickets,
    };
  }

  /**
   * Retrieves summary list of all properties owned by owner with bed counts.
   */
  async getProperties(ownerId: string): Promise<OwnerPropertySummary[]> {
    const properties = await this.propertyModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();

    const summaries = await Promise.all(
      properties.map(async (property) => {
        const [totalRooms, totalBeds, availableBeds, occupiedBeds, maintenanceBeds] =
          await Promise.all([
            this.roomModel.countDocuments({ propertyId: property._id }),
            this.bedModel.countDocuments({ propertyId: property._id }),
            this.bedModel.countDocuments({
              propertyId: property._id,
              permanentStatus: BedStatus.AVAILABLE,
            }),
            this.bedModel.countDocuments({
              propertyId: property._id,
              permanentStatus: BedStatus.BOOKED,
            }),
            this.bedModel.countDocuments({
              propertyId: property._id,
              permanentStatus: BedStatus.MAINTENANCE,
            }),
          ]);

        return {
          id: property._id.toString(),
          name: property.name,
          slug: property.slug,
          propertyType: property.propertyType,
          city: property.address.city,
          totalRooms,
          totalBeds,
          availableBeds,
          occupiedBeds,
          maintenanceBeds,
          status: property.status,
        };
      }),
    );

    return summaries;
  }

  /**
   * Retrieves deep room and bed inventory for a specific property.
   */
  async getPropertyInventory(ownerId: string, propertyId: string) {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }

    const property = await this.propertyModel.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not own this property.');
    }

    const [rooms, roomTypes, beds] = await Promise.all([
      this.roomModel.find({ propertyId: property._id }).sort({ floorNumber: 1, roomNumber: 1 }).exec(),
      this.roomTypeModel.find({ propertyId: property._id }).exec(),
      this.bedModel.find({ propertyId: property._id }).sort({ bedLabel: 1 }).exec(),
    ]);

    const roomTypeMap = new Map<string, RoomTypeDocument>();
    roomTypes.forEach((rt) => roomTypeMap.set(rt._id.toString(), rt));

    const bedsByRoom = new Map<string, BedDocument[]>();
    beds.forEach((bed) => {
      const roomIdStr = bed.roomId.toString();
      const list = bedsByRoom.get(roomIdStr) || [];
      list.push(bed);
      bedsByRoom.set(roomIdStr, list);
    });

    const structuredRooms = rooms.map((room) => {
      const roomBeds = bedsByRoom.get(room._id.toString()) || [];
      const roomType = roomTypeMap.get(room.roomTypeId.toString());

      return {
        id: room._id.toString(),
        roomNumber: room.roomNumber,
        floorNumber: room.floorNumber,
        status: room.status,
        roomType: roomType
          ? {
              id: roomType._id.toString(),
              name: roomType.name,
              sharingType: roomType.sharingType,
              baseRent: roomType.baseRent,
            }
          : null,
        beds: roomBeds.map((b) => ({
          id: b._id.toString(),
          bedLabel: b.bedLabel,
          position: b.position,
          permanentStatus: b.permanentStatus,
        })),
      };
    });

    return {
      property: {
        id: property._id.toString(),
        name: property.name,
        slug: property.slug,
        address: property.address,
      },
      rooms: structuredRooms,
    };
  }

  /**
   * Updates a bed's permanent operational status between AVAILABLE and MAINTENANCE.
   */
  async updateBedStatus(
    bedId: string,
    ownerId: string,
    role: UserRole,
    newStatus: 'AVAILABLE' | 'MAINTENANCE',
  ): Promise<BedDocument> {
    if (!Types.ObjectId.isValid(bedId)) {
      throw new BadRequestException('Invalid bed ID format.');
    }

    const bed = await this.bedModel.findById(bedId);
    if (!bed) {
      throw new NotFoundException('Bed not found.');
    }

    const property = await this.propertyModel.findById(bed.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (role === UserRole.OWNER && property.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not have permission to manage this bed.');
    }

    if (bed.permanentStatus === BedStatus.BOOKED) {
      throw new BadRequestException(
        'This bed has an active confirmed booking and cannot be toggled to maintenance without resolving the booking.',
      );
    }

    bed.permanentStatus = newStatus === 'MAINTENANCE' ? BedStatus.MAINTENANCE : BedStatus.AVAILABLE;
    await bed.save();

    this.logger.log(`Bed ${bed._id} (${bed.bedLabel}) status updated to ${bed.permanentStatus} by ${ownerId}`);
    return bed;
  }

  /**
   * Retrieves owner profile attributes.
   */
  async getProfile(ownerId: string): Promise<OwnerProfileDocument | null> {
    return this.ownerProfileModel.findOne({ userId: new Types.ObjectId(ownerId) }).exec();
  }

  /**
   * Updates owner KYC and business profile details.
   */
  async updateProfile(ownerId: string, dto: UpdateOwnerProfileDto): Promise<OwnerProfileDocument> {
    let profile = await this.ownerProfileModel.findOne({ userId: new Types.ObjectId(ownerId) });
    if (!profile) {
      profile = new this.ownerProfileModel({ userId: new Types.ObjectId(ownerId) });
    }

    if (dto.companyName !== undefined) profile.companyName = dto.companyName;
    if (dto.panNumber !== undefined) profile.panNumber = dto.panNumber;
    if (dto.businessAddress !== undefined) profile.businessAddress = dto.businessAddress;

    await profile.save();
    return profile;
  }

  /**
   * Creates a new property listing with address, coordinates, and optional room types.
   * Defaults to PENDING_VERIFICATION and PENDING approval.
   */
  async createProperty(ownerId: string, dto: CreatePropertyDto): Promise<PropertyDocument> {
    this.validateCoordinates(dto.location.coordinates);

    const baseSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${randomSuffix}`;

    const property = await this.propertyModel.create({
      ownerId: new Types.ObjectId(ownerId),
      name: dto.name,
      slug,
      propertyType: dto.propertyType,
      description: dto.description,
      address: dto.address,
      location: {
        type: 'Point',
        coordinates: [dto.location.coordinates[0], dto.location.coordinates[1]],
      },
      googlePlaceId: dto.googlePlaceId,
      genderPreference: dto.genderPreference,
      furnishing: dto.furnishing || 'FULLY_FURNISHED',
      status: PropertyStatus.PENDING_VERIFICATION,
      approvalStatus: ApprovalStatus.PENDING,
      isPhysicallyVerified: false,
      amenities: dto.amenities || [],
      rules: dto.rules || [],
      images: dto.images || [],
    });

    if (dto.roomTypes && dto.roomTypes.length > 0) {
      for (const rt of dto.roomTypes) {
        await this.roomTypeModel.create({
          propertyId: property._id,
          name: rt.name,
          sharingType: rt.sharingType,
          baseRent: rt.baseRent,
          deposit: rt.deposit,
          attachedBathroom: rt.attachedBathroom ?? true,
          ac: rt.ac ?? true,
          furnishingDetails: rt.furnishingDetails || ['Bed', 'Study Table', 'Wardrobe'],
        });
      }
    }

    this.logger.log(`Property created: ${property.name} (${property._id}) by owner ${ownerId}`);
    return property;
  }

  /**
   * Updates property details for an owner.
   */
  async updateProperty(
    ownerId: string,
    propertyId: string,
    role: UserRole,
    dto: UpdatePropertyDto,
  ): Promise<PropertyDocument> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }

    const property = await this.propertyModel.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (role !== UserRole.ADMIN && property.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this property.');
    }

    if (dto.name !== undefined) property.name = dto.name;
    if (dto.propertyType !== undefined) property.propertyType = dto.propertyType;
    if (dto.description !== undefined) property.description = dto.description;
    if (dto.address !== undefined) property.address = dto.address as any;
    if (dto.genderPreference !== undefined) property.genderPreference = dto.genderPreference;
    if (dto.furnishing !== undefined) property.furnishing = dto.furnishing;
    if (dto.amenities !== undefined) property.amenities = dto.amenities;
    if (dto.rules !== undefined) property.rules = dto.rules;
    if (dto.images !== undefined) property.images = dto.images;
    if (dto.googlePlaceId !== undefined) property.googlePlaceId = dto.googlePlaceId;

    if (dto.location) {
      this.validateCoordinates(dto.location.coordinates);
      property.location = {
        type: 'Point',
        coordinates: [dto.location.coordinates[0], dto.location.coordinates[1]],
      };
    }

    if (dto.status !== undefined && role === UserRole.ADMIN) {
      property.status = dto.status;
    }

    await property.save();
    return property;
  }

  /**
   * Creates a room within a property.
   */
  async createRoom(
    ownerId: string,
    propertyId: string,
    role: UserRole,
    dto: CreateRoomDto,
  ): Promise<RoomDocument> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }

    const property = await this.propertyModel.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (role !== UserRole.ADMIN && property.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not have permission to add rooms to this property.');
    }

    if (!Types.ObjectId.isValid(dto.roomTypeId)) {
      throw new BadRequestException('Invalid roomTypeId format.');
    }

    const roomType = await this.roomTypeModel.findOne({
      _id: new Types.ObjectId(dto.roomTypeId),
      propertyId: property._id,
    });
    if (!roomType) {
      throw new NotFoundException('RoomType not found for this property.');
    }

    const room = await this.roomModel.create({
      propertyId: property._id,
      roomTypeId: roomType._id,
      floorNumber: dto.floorNumber,
      roomNumber: dto.roomNumber,
      status: dto.status || 'ACTIVE',
    });

    return room;
  }

  /**
   * Creates a bed within a room.
   */
  async createBed(
    ownerId: string,
    roomId: string,
    role: UserRole,
    dto: CreateBedDto,
  ): Promise<BedDocument> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new BadRequestException('Invalid roomId format.');
    }

    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    const property = await this.propertyModel.findById(room.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (role !== UserRole.ADMIN && property.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not have permission to add beds to this room.');
    }

    const bed = await this.bedModel.create({
      propertyId: property._id,
      roomId: room._id,
      roomTypeId: room.roomTypeId,
      bedLabel: dto.bedLabel,
      position: dto.position || 'STANDARD',
      permanentStatus: dto.permanentStatus || BedStatus.AVAILABLE,
    });

    return bed;
  }

  /**
   * Retrieves all booking requests and history for properties owned by this owner.
   */
  async getOwnerBookings(ownerId: string): Promise<BookingDocument[]> {
    const properties = await this.propertyModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .select('_id')
      .exec();

    const propertyIds = properties.map((p) => p._id);
    if (propertyIds.length === 0) return [];

    return this.bookingModel
      .find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'name slug address images')
      .populate('roomTypeId', 'name sharingType baseRent deposit')
      .populate('roomId', 'roomNumber floorNumber')
      .populate('bedId', 'bedLabel position permanentStatus')
      .populate('studentId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Owner accepts or rejects a booking request with double-booking collision protection.
   * Distinguishes vendor-accepted booking from a paid transaction. No earnings/payment.
   */
  async decideBooking(
    ownerId: string,
    bookingId: string,
    role: UserRole,
    dto: BookingDecisionDto,
  ): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID format.');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking request not found.');
    }

    const property = await this.propertyModel.findById(booking.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    if (role !== UserRole.ADMIN && property.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You do not own the property for this booking request.');
    }

    if (dto.decision === 'ACCEPT') {
      // 1. Conflict Protection: Check if bed is already BOOKED or OCCUPIED
      const bed = await this.bedModel.findById(booking.bedId);
      if (!bed) {
        throw new NotFoundException('Target bed not found.');
      }

      if (bed.permanentStatus === BedStatus.BOOKED || bed.permanentStatus === BedStatus.OCCUPIED) {
        throw new ConflictException(
          'Conflict: This bed has already been accepted/confirmed for another booking and is unavailable.',
        );
      }

      // 2. Check if another booking for this bed has already been accepted or confirmed
      const conflictingBooking = await this.bookingModel.findOne({
        _id: { $ne: booking._id },
        bedId: booking.bedId,
        status: { $in: [BookingStatus.ACCEPTED, BookingStatus.CONFIRMED] },
      });

      if (conflictingBooking) {
        throw new ConflictException(
          `Conflict: Bed ${bed.bedLabel} has already been accepted under booking reference ${conflictingBooking.bookingReference}.`,
        );
      }

      // 3. Mark bed as booked
      bed.permanentStatus = BedStatus.BOOKED;
      await bed.save();

      // 4. Update booking to ACCEPTED (Not paid - request accepted workflow)
      booking.status = BookingStatus.ACCEPTED;
      if (dto.reason) {
        booking.cancelledReason = dto.reason;
      }

      // Clear any temporary holds since decision is finalized
      await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
      await this.redisService.del(`booking:user_hold:${booking.studentId.toString()}`);

      await booking.save();
      this.logger.log(`Booking ${booking.bookingReference} ACCEPTED by owner ${ownerId}`);
      return booking;
    } else {
      // REJECT decision
      booking.status = BookingStatus.REJECTED;
      booking.cancelledReason = dto.reason || 'Booking request rejected by owner';
      booking.cancellationDate = new Date();

      // If bed was marked booked by this booking, revert to available
      await this.bedModel.findByIdAndUpdate(booking.bedId, {
        permanentStatus: BedStatus.AVAILABLE,
      });

      // Clear any hold
      await this.redisService.del(`booking:hold:${booking.bedId.toString()}`);
      await this.redisService.del(`booking:user_hold:${booking.studentId.toString()}`);

      await booking.save();
      this.logger.log(`Booking ${booking.bookingReference} REJECTED by owner ${ownerId}`);
      return booking;
    }
  }

  private validateCoordinates(coords: [number, number]): void {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new BadRequestException('Location coordinates must be an array of [longitude, latitude].');
    }
    const [lng, lat] = coords;
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      throw new BadRequestException('Coordinates must be valid numbers.');
    }
    if (lat < -90 || lat > 90) {
      throw new BadRequestException(`Latitude (${lat}) must be between -90 and 90 degrees.`);
    }
    if (lng < -180 || lng > 180) {
      throw new BadRequestException(`Longitude (${lng}) must be between -180 and 180 degrees.`);
    }
  }
}
