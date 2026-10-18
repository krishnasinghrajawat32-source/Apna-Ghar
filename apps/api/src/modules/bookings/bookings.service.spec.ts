import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './schemas/booking.schema';
import { Bed } from '../inventory/schemas/bed.schema';
import { Property } from '../properties/schemas/property.schema';
import { RedisService } from '../../redis/redis.service';
import { BookingStatus, BedStatus, UserRole } from '@apna-ghar/shared-types';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockOtherStudentId = new Types.ObjectId().toString();
  const mockPropertyId = new Types.ObjectId();
  const mockRoomTypeId = new Types.ObjectId();
  const mockRoomId = new Types.ObjectId();
  const mockBedId = new Types.ObjectId();
  const mockBookingId = new Types.ObjectId();

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
    permanentStatus: BedStatus.AVAILABLE,
  };

  const mockBookingDoc = {
    _id: mockBookingId,
    bookingReference: 'AG-20261018-ABCD',
    studentId: new Types.ObjectId(mockStudentId),
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
    status: BookingStatus.PENDING_PAYMENT,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
        {
          provide: getModelToken(Bed.name),
          useValue: mockBedModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
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
      await expect(service.calculateChargesPreview('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
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
      await expect(
        service.createBooking(mockStudentId, {
          ...validDto,
          moveInDate: '2020-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if move-in date is > 60 days in advance', async () => {
      const farFuture = new Date(Date.now() + 86400000 * 90).toISOString();
      await expect(
        service.createBooking(mockStudentId, {
          ...validDto,
          moveInDate: farFuture,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bed is not currently held in Redis', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(service.createBooking(mockStudentId, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if bed is held in Redis by another student', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          holdId: 'hold-123',
          studentId: mockOtherStudentId,
          bedId: mockBedId.toString(),
        }),
      );

      await expect(service.createBooking(mockStudentId, validDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create booking successfully with PENDING_PAYMENT status and reference', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          holdId: 'hold-123',
          studentId: mockStudentId,
          bedId: mockBedId.toString(),
        }),
      );

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
      expect(mockBookingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: new Types.ObjectId(mockStudentId),
          status: BookingStatus.PENDING_PAYMENT,
          rentAmount: 8500,
          depositAmount: 8500,
          totalInitialPayment: 17000,
        }),
      );
      // Verify Redis hold was extended for payment window
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `booking:hold:${mockBedId.toString()}`,
        expect.any(String),
        900,
      );
    });
  });

  describe('updateBookingStatus', () => {
    it('should allow student to cancel their own PENDING_PAYMENT booking and release Redis lock', async () => {
      mockBookingModel.findById.mockResolvedValue({
        ...mockBookingDoc,
        status: BookingStatus.PENDING_PAYMENT,
        save: jest.fn().mockResolvedValue(true),
      });
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.updateBookingStatus(
        mockBookingId.toString(),
        mockStudentId,
        UserRole.STUDENT,
        { status: BookingStatus.CANCELLED, reason: 'Found accommodation elsewhere' },
      );

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`);
    });

    it('should throw ForbiddenException if student attempts to confirm booking', async () => {
      mockBookingModel.findById.mockResolvedValue(mockBookingDoc);

      await expect(
        service.updateBookingStatus(
          mockBookingId.toString(),
          mockStudentId,
          UserRole.STUDENT,
          { status: BookingStatus.CONFIRMED },
        ),
      ).rejects.toThrow(ForbiddenException);
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

      await expect(
        service.getBookingById(mockBookingId.toString(), mockStudentId, UserRole.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
