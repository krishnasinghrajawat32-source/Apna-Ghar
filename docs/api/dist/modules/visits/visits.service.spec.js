"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const visits_service_1 = require("./visits.service");
const visit_schema_1 = require("./schemas/visit.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('VisitsService', () => {
    let service;
    const mockStudentId = new mongoose_2.Types.ObjectId();
    const mockOwnerId = new mongoose_2.Types.ObjectId();
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockVisitId = new mongoose_2.Types.ObjectId();
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
        status: shared_types_1.VisitStatus.REQUESTED,
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                visits_service_1.VisitsService,
                {
                    provide: (0, mongoose_1.getModelToken)(visit_schema_1.Visit.name),
                    useValue: mockVisitModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
            ],
        }).compile();
        service = module.get(visits_service_1.VisitsService);
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
            await expect(service.createVisit(mockStudentId.toString(), {
                propertyId: mockPropertyId.toString(),
                scheduledDate: pastDate,
                slot: '10:00-12:00',
                contactPhone: '+919876543210',
            })).rejects.toThrow(common_1.BadRequestException);
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
            expect(result.status).toBe(shared_types_1.VisitStatus.REQUESTED);
        });
    });
    describe('updateVisitStatus', () => {
        it('should allow student to cancel their own visit', async () => {
            const visitInstance = { ...mockVisit, status: shared_types_1.VisitStatus.REQUESTED, save: jest.fn() };
            mockVisitModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(visitInstance),
            });
            const result = await service.updateVisitStatus(mockVisitId.toString(), mockStudentId.toString(), shared_types_1.UserRole.STUDENT, { status: shared_types_1.VisitStatus.CANCELLED, reason: 'Found alternative' });
            expect(result.status).toBe(shared_types_1.VisitStatus.CANCELLED);
            expect(visitInstance.save).toHaveBeenCalled();
        });
        it('should forbid student from confirming their own visit', async () => {
            const visitInstance = { ...mockVisit, status: shared_types_1.VisitStatus.REQUESTED, save: jest.fn() };
            mockVisitModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(visitInstance),
            });
            await expect(service.updateVisitStatus(mockVisitId.toString(), mockStudentId.toString(), shared_types_1.UserRole.STUDENT, { status: shared_types_1.VisitStatus.CONFIRMED })).rejects.toThrow(common_1.ForbiddenException);
        });
    });
});
//# sourceMappingURL=visits.service.spec.js.map