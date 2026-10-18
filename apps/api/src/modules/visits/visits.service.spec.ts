import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { Visit } from './schemas/visit.schema';
import { Property } from '../properties/schemas/property.schema';
import { VisitStatus, UserRole } from '@apna-ghar/shared-types';

describe('VisitsService', () => {
  let service: VisitsService;

  const mockStudentId = new Types.ObjectId();
  const mockOwnerId = new Types.ObjectId();
  const mockPropertyId = new Types.ObjectId();
  const mockVisitId = new Types.ObjectId();

  const mockProperty = {
    _id: mockPropertyId,
    name: 'Greenwood Residency',
    ownerId: mockOwnerId,
  };

  const mockVisit = {
    _id: mockVisitId,
    studentId: mockStudentId,
    propertyId: mockPropertyId,
    ownerId: mockOwnerId,
    scheduledAt: new Date(Date.now() + 86400000), // tomorrow
    slot: '10:00-12:00',
    status: VisitStatus.REQUESTED,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockVisitModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockPropertyModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        {
          provide: getModelToken(Visit.name),
          useValue: mockVisitModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
      ],
    }).compile();

    service = module.get<VisitsService>(VisitsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVisit', () => {
    it('should throw BadRequestException if scheduled date is in the past', async () => {
      mockPropertyModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProperty),
      });

      const pastDate = new Date(Date.now() - 86400000 * 2).toISOString(); // 2 days ago

      await expect(
        service.createVisit(mockStudentId.toString(), {
          propertyId: mockPropertyId.toString(),
          scheduledDate: pastDate,
          slot: '10:00-12:00',
          contactPhone: '+919876543210',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create visit in REQUESTED status if valid', async () => {
      mockPropertyModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProperty),
      });
      mockVisitModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockVisitModel.create.mockResolvedValue(mockVisit);

      const futureDate = new Date(Date.now() + 86400000 * 2).toISOString(); // 2 days later

      const result = await service.createVisit(mockStudentId.toString(), {
        propertyId: mockPropertyId.toString(),
        scheduledDate: futureDate,
        slot: '10:00-12:00',
        contactPhone: '+919876543210',
      });

      expect(mockVisitModel.create).toHaveBeenCalled();
      expect(result.status).toBe(VisitStatus.REQUESTED);
    });
  });

  describe('updateVisitStatus', () => {
    it('should allow student to cancel their own visit', async () => {
      const visitInstance = { ...mockVisit, status: VisitStatus.REQUESTED, save: jest.fn() };
      mockVisitModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(visitInstance),
      });

      const result = await service.updateVisitStatus(
        mockVisitId.toString(),
        mockStudentId.toString(),
        UserRole.STUDENT,
        { status: VisitStatus.CANCELLED, reason: 'Found alternative' },
      );

      expect(result.status).toBe(VisitStatus.CANCELLED);
      expect(visitInstance.save).toHaveBeenCalled();
    });

    it('should forbid student from confirming their own visit', async () => {
      const visitInstance = { ...mockVisit, status: VisitStatus.REQUESTED, save: jest.fn() };
      mockVisitModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(visitInstance),
      });

      await expect(
        service.updateVisitStatus(
          mockVisitId.toString(),
          mockStudentId.toString(),
          UserRole.STUDENT,
          { status: VisitStatus.CONFIRMED },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
