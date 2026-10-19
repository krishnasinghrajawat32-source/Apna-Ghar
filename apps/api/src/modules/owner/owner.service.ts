import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OwnerOverviewMetrics,
  OwnerPropertySummary,
  BedStatus,
  BookingStatus,
  VisitStatus,
  UserRole,
} from '@apna-ghar/shared-types';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Room, RoomDocument } from '../inventory/schemas/room.schema';
import { Bed, BedDocument } from '../inventory/schemas/bed.schema';
import { RoomType, RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Visit, VisitDocument } from '../visits/schemas/visit.schema';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema';

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
}
