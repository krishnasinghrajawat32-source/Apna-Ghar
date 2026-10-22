"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const owner_service_1 = require("./owner.service");
const property_schema_1 = require("../properties/schemas/property.schema");
const room_schema_1 = require("../inventory/schemas/room.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const visit_schema_1 = require("../visits/schemas/visit.schema");
const ticket_schema_1 = require("../tickets/schemas/ticket.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('OwnerService', () => {
    let service;
    const mockOwnerId = new mongoose_2.Types.ObjectId().toString();
    const mockOtherOwnerId = new mongoose_2.Types.ObjectId().toString();
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockRoomId = new mongoose_2.Types.ObjectId();
    const mockRoomTypeId = new mongoose_2.Types.ObjectId();
    const mockBedId = new mongoose_2.Types.ObjectId();
    const mockPropertyDoc = {
        _id: mockPropertyId,
        ownerId: new mongoose_2.Types.ObjectId(mockOwnerId),
        name: 'Sunrise Residency',
        slug: 'sunrise-residency',
        propertyType: shared_types_1.PropertyType.HOSTEL,
        address: {
            city: 'Kota',
            street: '12 College St',
        },
        status: shared_types_1.PropertyStatus.ACTIVE,
    };
    const mockBedDoc = {
        _id: mockBedId,
        propertyId: mockPropertyId,
        roomId: mockRoomId,
        roomTypeId: mockRoomTypeId,
        bedLabel: 'Bed 101-A',
        permanentStatus: shared_types_1.BedStatus.AVAILABLE,
        save: jest.fn().mockResolvedValue(true),
    };
    const mockPropertyModel = {
        find: jest.fn(),
        findById: jest.fn(),
        countDocuments: jest.fn(),
    };
    const mockRoomModel = {
        find: jest.fn(),
        countDocuments: jest.fn(),
    };
    const mockBedModel = {
        find: jest.fn(),
        findById: jest.fn(),
        countDocuments: jest.fn(),
    };
    const mockRoomTypeModel = {
        find: jest.fn(),
    };
    const mockBookingModel = {
        countDocuments: jest.fn(),
    };
    const mockVisitModel = {
        countDocuments: jest.fn(),
    };
    const mockTicketModel = {
        countDocuments: jest.fn(),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                owner_service_1.OwnerService,
                { provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name), useValue: mockPropertyModel },
                { provide: (0, mongoose_1.getModelToken)(room_schema_1.Room.name), useValue: mockRoomModel },
                { provide: (0, mongoose_1.getModelToken)(bed_schema_1.Bed.name), useValue: mockBedModel },
                { provide: (0, mongoose_1.getModelToken)(room_type_schema_1.RoomType.name), useValue: mockRoomTypeModel },
                { provide: (0, mongoose_1.getModelToken)(booking_schema_1.Booking.name), useValue: mockBookingModel },
                { provide: (0, mongoose_1.getModelToken)(visit_schema_1.Visit.name), useValue: mockVisitModel },
                { provide: (0, mongoose_1.getModelToken)(ticket_schema_1.Ticket.name), useValue: mockTicketModel },
            ],
        }).compile();
        service = module.get(owner_service_1.OwnerService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getOverview', () => {
        it('should return zeroes if owner has no properties', async () => {
            mockPropertyModel.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([]),
                }),
            });
            const metrics = await service.getOverview(mockOwnerId);
            expect(metrics.totalProperties).toBe(0);
            expect(metrics.totalBeds).toBe(0);
            expect(metrics.occupancyRate).toBe(0);
        });
        it('should aggregate metrics when properties exist', async () => {
            mockPropertyModel.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([{ _id: mockPropertyId }]),
                }),
            });
            mockRoomModel.countDocuments.mockResolvedValue(10);
            mockBedModel.countDocuments
                .mockResolvedValueOnce(20) // total
                .mockResolvedValueOnce(12) // booked
                .mockResolvedValueOnce(6) // available
                .mockResolvedValueOnce(2); // maintenance
            mockBookingModel.countDocuments
                .mockResolvedValueOnce(15) // total
                .mockResolvedValueOnce(12); // confirmed
            mockVisitModel.countDocuments.mockResolvedValue(3);
            mockTicketModel.countDocuments.mockResolvedValue(2);
            const metrics = await service.getOverview(mockOwnerId);
            expect(metrics.totalProperties).toBe(1);
            expect(metrics.totalRooms).toBe(10);
            expect(metrics.totalBeds).toBe(20);
            expect(metrics.occupiedBeds).toBe(12);
            expect(metrics.availableBeds).toBe(6);
            expect(metrics.maintenanceBeds).toBe(2);
            expect(metrics.occupancyRate).toBe(60); // 12/20 * 100
            expect(metrics.totalBookings).toBe(15);
            expect(metrics.confirmedBookings).toBe(12);
            expect(metrics.pendingVisits).toBe(3);
            expect(metrics.openTickets).toBe(2);
        });
    });
    describe('getProperties', () => {
        it('should return list of property summaries', async () => {
            mockPropertyModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([mockPropertyDoc]),
                }),
            });
            mockRoomModel.countDocuments.mockResolvedValue(5);
            mockBedModel.countDocuments
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(4) // available
                .mockResolvedValueOnce(5) // booked
                .mockResolvedValueOnce(1); // maintenance
            const list = await service.getProperties(mockOwnerId);
            expect(list).toHaveLength(1);
            expect(list[0].name).toBe('Sunrise Residency');
            expect(list[0].totalRooms).toBe(5);
            expect(list[0].totalBeds).toBe(10);
        });
    });
    describe('getPropertyInventory', () => {
        it('should throw BadRequestException on invalid propertyId format', async () => {
            await expect(service.getPropertyInventory(mockOwnerId, 'invalid-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if property does not exist', async () => {
            mockPropertyModel.findById.mockResolvedValue(null);
            await expect(service.getPropertyInventory(mockOwnerId, mockPropertyId.toString())).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ForbiddenException if property is not owned by user', async () => {
            mockPropertyModel.findById.mockResolvedValue({
                ...mockPropertyDoc,
                ownerId: new mongoose_2.Types.ObjectId(mockOtherOwnerId),
            });
            await expect(service.getPropertyInventory(mockOwnerId, mockPropertyId.toString())).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('updateBedStatus', () => {
        it('should throw BadRequestException if bed is booked', async () => {
            mockBedModel.findById.mockResolvedValue({
                ...mockBedDoc,
                permanentStatus: shared_types_1.BedStatus.BOOKED,
            });
            mockPropertyModel.findById.mockResolvedValue(mockPropertyDoc);
            await expect(service.updateBedStatus(mockBedId.toString(), mockOwnerId, shared_types_1.UserRole.OWNER, 'MAINTENANCE')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should update status between AVAILABLE and MAINTENANCE successfully', async () => {
            const testBed = { ...mockBedDoc, permanentStatus: shared_types_1.BedStatus.AVAILABLE };
            mockBedModel.findById.mockResolvedValue(testBed);
            mockPropertyModel.findById.mockResolvedValue(mockPropertyDoc);
            const result = await service.updateBedStatus(mockBedId.toString(), mockOwnerId, shared_types_1.UserRole.OWNER, 'MAINTENANCE');
            expect(result.permanentStatus).toBe(shared_types_1.BedStatus.MAINTENANCE);
            expect(testBed.save).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=owner.service.spec.js.map