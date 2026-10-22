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
var OwnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
const property_schema_1 = require("../properties/schemas/property.schema");
const room_schema_1 = require("../inventory/schemas/room.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const visit_schema_1 = require("../visits/schemas/visit.schema");
const ticket_schema_1 = require("../tickets/schemas/ticket.schema");
let OwnerService = OwnerService_1 = class OwnerService {
    propertyModel;
    roomModel;
    bedModel;
    roomTypeModel;
    bookingModel;
    visitModel;
    ticketModel;
    logger = new common_1.Logger(OwnerService_1.name);
    constructor(propertyModel, roomModel, bedModel, roomTypeModel, bookingModel, visitModel, ticketModel) {
        this.propertyModel = propertyModel;
        this.roomModel = roomModel;
        this.bedModel = bedModel;
        this.roomTypeModel = roomTypeModel;
        this.bookingModel = bookingModel;
        this.visitModel = visitModel;
        this.ticketModel = ticketModel;
    }
    /**
     * Calculates aggregated portfolio performance metrics for an owner.
     */
    async getOverview(ownerId) {
        const properties = await this.propertyModel
            .find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) })
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
        const [totalRooms, totalBeds, occupiedBeds, availableBeds, maintenanceBeds, totalBookings, confirmedBookings, pendingVisits, openTickets,] = await Promise.all([
            this.roomModel.countDocuments({ propertyId: { $in: propertyIds } }),
            this.bedModel.countDocuments({ propertyId: { $in: propertyIds } }),
            this.bedModel.countDocuments({
                propertyId: { $in: propertyIds },
                permanentStatus: shared_types_1.BedStatus.BOOKED,
            }),
            this.bedModel.countDocuments({
                propertyId: { $in: propertyIds },
                permanentStatus: shared_types_1.BedStatus.AVAILABLE,
            }),
            this.bedModel.countDocuments({
                propertyId: { $in: propertyIds },
                permanentStatus: shared_types_1.BedStatus.MAINTENANCE,
            }),
            this.bookingModel.countDocuments({ propertyId: { $in: propertyIds } }),
            this.bookingModel.countDocuments({
                propertyId: { $in: propertyIds },
                status: shared_types_1.BookingStatus.CONFIRMED,
            }),
            this.visitModel.countDocuments({
                propertyId: { $in: propertyIds },
                status: shared_types_1.VisitStatus.REQUESTED,
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
    async getProperties(ownerId) {
        const properties = await this.propertyModel
            .find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) })
            .sort({ createdAt: -1 })
            .exec();
        const summaries = await Promise.all(properties.map(async (property) => {
            const [totalRooms, totalBeds, availableBeds, occupiedBeds, maintenanceBeds] = await Promise.all([
                this.roomModel.countDocuments({ propertyId: property._id }),
                this.bedModel.countDocuments({ propertyId: property._id }),
                this.bedModel.countDocuments({
                    propertyId: property._id,
                    permanentStatus: shared_types_1.BedStatus.AVAILABLE,
                }),
                this.bedModel.countDocuments({
                    propertyId: property._id,
                    permanentStatus: shared_types_1.BedStatus.BOOKED,
                }),
                this.bedModel.countDocuments({
                    propertyId: property._id,
                    permanentStatus: shared_types_1.BedStatus.MAINTENANCE,
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
        }));
        return summaries;
    }
    /**
     * Retrieves deep room and bed inventory for a specific property.
     */
    async getPropertyInventory(ownerId, propertyId) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.BadRequestException('Invalid property ID format.');
        }
        const property = await this.propertyModel.findById(propertyId);
        if (!property) {
            throw new common_1.NotFoundException('Property not found.');
        }
        if (property.ownerId.toString() !== ownerId) {
            throw new common_1.ForbiddenException('You do not own this property.');
        }
        const [rooms, roomTypes, beds] = await Promise.all([
            this.roomModel.find({ propertyId: property._id }).sort({ floorNumber: 1, roomNumber: 1 }).exec(),
            this.roomTypeModel.find({ propertyId: property._id }).exec(),
            this.bedModel.find({ propertyId: property._id }).sort({ bedLabel: 1 }).exec(),
        ]);
        const roomTypeMap = new Map();
        roomTypes.forEach((rt) => roomTypeMap.set(rt._id.toString(), rt));
        const bedsByRoom = new Map();
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
    async updateBedStatus(bedId, ownerId, role, newStatus) {
        if (!mongoose_2.Types.ObjectId.isValid(bedId)) {
            throw new common_1.BadRequestException('Invalid bed ID format.');
        }
        const bed = await this.bedModel.findById(bedId);
        if (!bed) {
            throw new common_1.NotFoundException('Bed not found.');
        }
        const property = await this.propertyModel.findById(bed.propertyId);
        if (!property) {
            throw new common_1.NotFoundException('Property not found.');
        }
        if (role === shared_types_1.UserRole.OWNER && property.ownerId.toString() !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to manage this bed.');
        }
        if (bed.permanentStatus === shared_types_1.BedStatus.BOOKED) {
            throw new common_1.BadRequestException('This bed has an active confirmed booking and cannot be toggled to maintenance without resolving the booking.');
        }
        bed.permanentStatus = newStatus === 'MAINTENANCE' ? shared_types_1.BedStatus.MAINTENANCE : shared_types_1.BedStatus.AVAILABLE;
        await bed.save();
        this.logger.log(`Bed ${bed._id} (${bed.bedLabel}) status updated to ${bed.permanentStatus} by ${ownerId}`);
        return bed;
    }
};
exports.OwnerService = OwnerService;
exports.OwnerService = OwnerService = OwnerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(1, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __param(2, (0, mongoose_1.InjectModel)(bed_schema_1.Bed.name)),
    __param(3, (0, mongoose_1.InjectModel)(room_type_schema_1.RoomType.name)),
    __param(4, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(5, (0, mongoose_1.InjectModel)(visit_schema_1.Visit.name)),
    __param(6, (0, mongoose_1.InjectModel)(ticket_schema_1.Ticket.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], OwnerService);
//# sourceMappingURL=owner.service.js.map