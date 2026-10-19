import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { Property } from '../properties/schemas/property.schema';
import { Room } from '../inventory/schemas/room.schema';
import { Bed } from '../inventory/schemas/bed.schema';
import { RoomType } from '../inventory/schemas/room-type.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { Visit } from '../visits/schemas/visit.schema';
import { Ticket } from '../tickets/schemas/ticket.schema';
import { BedStatus, UserRole, PropertyType, PropertyStatus } from '@apna-ghar/shared-types';

describe('OwnerService', () => {
  let service: OwnerService;

  const mockOwnerId = new Types.ObjectId().toString();
  const mockOtherOwnerId = new Types.ObjectId().toString();
  const mockPropertyId = new Types.ObjectId();
  const mockRoomId = new Types.ObjectId();
  const mockRoomTypeId = new Types.ObjectId();
  const mockBedId = new Types.ObjectId();

  const mockPropertyDoc = {
    _id: mockPropertyId,
    ownerId: new Types.ObjectId(mockOwnerId),
    name: 'Sunrise Residency',
    slug: 'sunrise-residency',
    propertyType: PropertyType.HOSTEL,
    address: {
      city: 'Kota',
      street: '12 College St',
    },
    status: PropertyStatus.ACTIVE,
  };

  const mockBedDoc = {
    _id: mockBedId,
    propertyId: mockPropertyId,
    roomId: mockRoomId,
    roomTypeId: mockRoomTypeId,
    bedLabel: 'Bed 101-A',
    permanentStatus: BedStatus.AVAILABLE,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerService,
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(Room.name), useValue: mockRoomModel },
        { provide: getModelToken(Bed.name), useValue: mockBedModel },
        { provide: getModelToken(RoomType.name), useValue: mockRoomTypeModel },
        { provide: getModelToken(Booking.name), useValue: mockBookingModel },
        { provide: getModelToken(Visit.name), useValue: mockVisitModel },
        { provide: getModelToken(Ticket.name), useValue: mockTicketModel },
      ],
    }).compile();

    service = module.get<OwnerService>(OwnerService);
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
        .mockResolvedValueOnce(6)  // available
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
        .mockResolvedValueOnce(4)  // available
        .mockResolvedValueOnce(5)  // booked
        .mockResolvedValueOnce(1); // maintenance

      const list = await service.getProperties(mockOwnerId);

      expect(list).toHaveLength(1);
      expect(list[0]!.name).toBe('Sunrise Residency');
      expect(list[0]!.totalRooms).toBe(5);
      expect(list[0]!.totalBeds).toBe(10);
    });
  });

  describe('getPropertyInventory', () => {
    it('should throw BadRequestException on invalid propertyId format', async () => {
      await expect(service.getPropertyInventory(mockOwnerId, 'invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if property does not exist', async () => {
      mockPropertyModel.findById.mockResolvedValue(null);
      await expect(
        service.getPropertyInventory(mockOwnerId, mockPropertyId.toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if property is not owned by user', async () => {
      mockPropertyModel.findById.mockResolvedValue({
        ...mockPropertyDoc,
        ownerId: new Types.ObjectId(mockOtherOwnerId),
      });

      await expect(
        service.getPropertyInventory(mockOwnerId, mockPropertyId.toString()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateBedStatus', () => {
    it('should throw BadRequestException if bed is booked', async () => {
      mockBedModel.findById.mockResolvedValue({
        ...mockBedDoc,
        permanentStatus: BedStatus.BOOKED,
      });

      mockPropertyModel.findById.mockResolvedValue(mockPropertyDoc);

      await expect(
        service.updateBedStatus(mockBedId.toString(), mockOwnerId, UserRole.OWNER, 'MAINTENANCE'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status between AVAILABLE and MAINTENANCE successfully', async () => {
      const testBed = { ...mockBedDoc, permanentStatus: BedStatus.AVAILABLE };
      mockBedModel.findById.mockResolvedValue(testBed);
      mockPropertyModel.findById.mockResolvedValue(mockPropertyDoc);

      const result = await service.updateBedStatus(
        mockBedId.toString(),
        mockOwnerId,
        UserRole.OWNER,
        'MAINTENANCE',
      );

      expect(result.permanentStatus).toBe(BedStatus.MAINTENANCE);
      expect(testBed.save).toHaveBeenCalled();
    });
  });
});
