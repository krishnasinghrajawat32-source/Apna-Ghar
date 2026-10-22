"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const mess_service_1 = require("./mess.service");
const mess_schema_1 = require("./schemas/mess.schema");
const mess_subscription_schema_1 = require("./schemas/mess-subscription.schema");
const user_schema_1 = require("../users/schemas/user.schema");
describe('MessService', () => {
    let service;
    const mockPartnerId = new mongoose_2.Types.ObjectId().toString();
    const mockOtherPartnerId = new mongoose_2.Types.ObjectId().toString();
    const mockStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockMessId = new mongoose_2.Types.ObjectId();
    const mockSubscriptionId = new mongoose_2.Types.ObjectId();
    const mockPlan = {
        id: 'plan-full-3m',
        name: 'Full Day Student Plan',
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
        daysPerWeek: 7,
        monthlyPrice: 3800,
    };
    const mockMessDoc = {
        _id: mockMessId,
        partnerId: new mongoose_2.Types.ObjectId(mockPartnerId),
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
        studentId: new mongoose_2.Types.ObjectId(mockStudentId),
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                mess_service_1.MessService,
                { provide: (0, mongoose_1.getModelToken)(mess_schema_1.Mess.name), useValue: mockMessModel },
                { provide: (0, mongoose_1.getModelToken)(mess_subscription_schema_1.MessSubscription.name), useValue: mockSubscriptionModel },
                { provide: (0, mongoose_1.getModelToken)(user_schema_1.User.name), useValue: mockUserModel },
            ],
        }).compile();
        service = module.get(mess_service_1.MessService);
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
            await expect(service.findBySlug('non-existent')).rejects.toThrow(common_1.NotFoundException);
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
            await expect(service.updateWeeklyMenu(mockPartnerId, 'invalid-id', [])).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if mess not found', async () => {
            mockMessModel.findById.mockResolvedValue(null);
            await expect(service.updateWeeklyMenu(mockPartnerId, mockMessId.toString(), [])).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ForbiddenException if user does not own mess', async () => {
            mockMessModel.findById.mockResolvedValue({
                ...mockMessDoc,
                partnerId: new mongoose_2.Types.ObjectId(mockOtherPartnerId),
            });
            await expect(service.updateWeeklyMenu(mockPartnerId, mockMessId.toString(), [])).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should update and save weekly menu successfully', async () => {
            const messToUpdate = { ...mockMessDoc, save: jest.fn().mockResolvedValue(true) };
            mockMessModel.findById.mockResolvedValue(messToUpdate);
            const newMenu = [
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
            await expect(service.createSubscription(mockStudentId, {
                messId: 'invalid-id',
                planId: 'plan-full-3m',
                startDate: '2026-11-01',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if mess not found', async () => {
            mockMessModel.findById.mockResolvedValue(null);
            await expect(service.createSubscription(mockStudentId, {
                messId: mockMessId.toString(),
                planId: 'plan-full-3m',
                startDate: '2026-11-01',
            })).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException if planId does not exist on mess', async () => {
            mockMessModel.findById.mockResolvedValue(mockMessDoc);
            await expect(service.createSubscription(mockStudentId, {
                messId: mockMessId.toString(),
                planId: 'invalid-plan',
                startDate: '2026-11-01',
            })).rejects.toThrow(common_1.BadRequestException);
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
            expect(mockSubscriptionModel.create).toHaveBeenCalledWith(expect.objectContaining({
                planId: 'plan-full-3m',
                monthlyPrice: 3800,
                status: 'ACTIVE',
            }));
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
//# sourceMappingURL=mess.service.spec.js.map