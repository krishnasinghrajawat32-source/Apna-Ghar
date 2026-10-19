import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessService } from './mess.service';
import { Mess } from './schemas/mess.schema';
import { MessSubscription } from './schemas/mess-subscription.schema';
import { User } from '../users/schemas/user.schema';
import { DailyMenu } from '@apna-ghar/shared-types';

describe('MessService', () => {
  let service: MessService;

  const mockPartnerId = new Types.ObjectId().toString();
  const mockOtherPartnerId = new Types.ObjectId().toString();
  const mockStudentId = new Types.ObjectId().toString();
  const mockMessId = new Types.ObjectId();
  const mockSubscriptionId = new Types.ObjectId();

  const mockPlan = {
    id: 'plan-full-3m',
    name: 'Full Day Student Plan',
    mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
    daysPerWeek: 7,
    monthlyPrice: 3800,
  };

  const mockMessDoc = {
    _id: mockMessId,
    partnerId: new Types.ObjectId(mockPartnerId),
    name: 'Annapurna Student Mess',
    slug: 'annapurna-student-mess',
    dietaryType: 'PURE_VEG',
    plans: [mockPlan],
    weeklyMenu: [],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockSubscriptionDoc = {
    _id: mockSubscriptionId,
    subscriptionNumber: 'MS-20261019-ABCD',
    studentId: new Types.ObjectId(mockStudentId),
    messId: mockMessId,
    planId: 'plan-full-3m',
    planName: 'Full Day Student Plan',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000 * 30),
    monthlyPrice: 3800,
    dietaryPreference: 'VEG',
    status: 'ACTIVE',
    qrPassCode: 'AG-MESS:MS-20261019-ABCD:STUDENT:plan-full-3m',
  };

  const mockMessModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(1),
    create: jest.fn(),
  };

  const mockSubscriptionModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessService,
        { provide: getModelToken(Mess.name), useValue: mockMessModel },
        { provide: getModelToken(MessSubscription.name), useValue: mockSubscriptionModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<MessService>(MessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of active messes', async () => {
      mockMessModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockMessDoc]),
        }),
      });

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockMessModel.find).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
  });

  describe('findBySlug', () => {
    it('should throw NotFoundException if mess does not exist', async () => {
      mockMessModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return mess document by slug', async () => {
      mockMessModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMessDoc),
      });

      const result = await service.findBySlug('annapurna-student-mess');
      expect(result).toBeDefined();
      expect(result.name).toBe('Annapurna Student Mess');
    });
  });

  describe('updateWeeklyMenu', () => {
    it('should throw BadRequestException if messId is invalid', async () => {
      await expect(
        service.updateWeeklyMenu(mockPartnerId, 'invalid-id', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if mess not found', async () => {
      mockMessModel.findById.mockResolvedValue(null);

      await expect(
        service.updateWeeklyMenu(mockPartnerId, mockMessId.toString(), []),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own mess', async () => {
      mockMessModel.findById.mockResolvedValue({
        ...mockMessDoc,
        partnerId: new Types.ObjectId(mockOtherPartnerId),
      });

      await expect(
        service.updateWeeklyMenu(mockPartnerId, mockMessId.toString(), []),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update and save weekly menu successfully', async () => {
      const messToUpdate = { ...mockMessDoc, save: jest.fn().mockResolvedValue(true) };
      mockMessModel.findById.mockResolvedValue(messToUpdate);

      const newMenu: DailyMenu[] = [
        {
          day: 'MONDAY',
          breakfast: 'Poha',
          lunch: 'Dal + Roti',
          dinner: 'Paneer + Rice',
        },
      ];

      const result = await service.updateWeeklyMenu(mockPartnerId, mockMessId.toString(), newMenu);
      expect(result.weeklyMenu).toEqual(newMenu);
      expect(messToUpdate.save).toHaveBeenCalled();
    });
  });

  describe('createSubscription', () => {
    it('should throw BadRequestException if messId is invalid', async () => {
      await expect(
        service.createSubscription(mockStudentId, {
          messId: 'invalid-id',
          planId: 'plan-full-3m',
          startDate: '2026-11-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if mess not found', async () => {
      mockMessModel.findById.mockResolvedValue(null);

      await expect(
        service.createSubscription(mockStudentId, {
          messId: mockMessId.toString(),
          planId: 'plan-full-3m',
          startDate: '2026-11-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if planId does not exist on mess', async () => {
      mockMessModel.findById.mockResolvedValue(mockMessDoc);

      await expect(
        service.createSubscription(mockStudentId, {
          messId: mockMessId.toString(),
          planId: 'invalid-plan',
          startDate: '2026-11-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and return active subscription with QR token', async () => {
      mockMessModel.findById.mockResolvedValue(mockMessDoc);
      mockSubscriptionModel.create.mockResolvedValue(mockSubscriptionDoc);
      mockSubscriptionModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockSubscriptionDoc),
          }),
        }),
      });

      const result = await service.createSubscription(mockStudentId, {
        messId: mockMessId.toString(),
        planId: 'plan-full-3m',
        startDate: '2026-11-01',
      });

      expect(result).toBeDefined();
      expect(mockSubscriptionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'plan-full-3m',
          monthlyPrice: 3800,
          status: 'ACTIVE',
        }),
      );
    });
  });

  describe('getStudentSubscriptions', () => {
    it('should return subscriptions for student', async () => {
      mockSubscriptionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockSubscriptionDoc]),
          }),
        }),
      });

      const list = await service.getStudentSubscriptions(mockStudentId);
      expect(list).toHaveLength(1);
    });
  });
});
