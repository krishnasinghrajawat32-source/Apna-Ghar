"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const room_type_schema_1 = require("./schemas/room-type.schema");
const room_schema_1 = require("./schemas/room.schema");
const bed_schema_1 = require("./schemas/bed.schema");
const redis_service_1 = require("../../redis/redis.service");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('InventoryService', () => {
    let service;
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockRoomTypeId = new mongoose_2.Types.ObjectId();
    const mockRoomId = new mongoose_2.Types.ObjectId();
    const mockBedId = new mongoose_2.Types.ObjectId();
    const mockStudentId = 'student-uuid-123';
    const mockOtherStudentId = 'student-uuid-999';
    const mockBedDoc = {
        _id: mockBedId,
        propertyId: mockPropertyId,
        roomId: mockRoomId,
        roomTypeId: mockRoomTypeId,
        bedLabel: 'Bed 101-A',
        permanentStatus: shared_types_1.BedStatus.AVAILABLE,
        toJSON: () => ({
            id: mockBedId.toString(),
            propertyId: mockPropertyId.toString(),
            roomId: mockRoomId.toString(),
            roomTypeId: mockRoomTypeId.toString(),
            bedLabel: 'Bed 101-A',
            permanentStatus: shared_types_1.BedStatus.AVAILABLE,
        }),
    };
    const mockBedModel = {
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        countDocuments: jest.fn(),
    };
    const mockRoomModel = {
        find: jest.fn(),
    };
    const mockRoomTypeModel = {
        find: jest.fn(),
    };
    const mockRedisClient = {
        ttl: jest.fn().mockResolvedValue(450),
    };
    const mockRedisService = {
        get: jest.fn(),
        set: jest.fn(),
        setNxEx: jest.fn(),
        del: jest.fn(),
        getClient: jest.fn().mockReturnValue(mockRedisClient),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                inventory_service_1.InventoryService,
                {
                    provide: (0, mongoose_1.getModelToken)(room_type_schema_1.RoomType.name),
                    useValue: mockRoomTypeModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(room_schema_1.Room.name),
                    useValue: mockRoomModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(bed_schema_1.Bed.name),
                    useValue: mockBedModel,
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: mockRedisService,
                },
            ],
        }).compile();
        service = module.get(inventory_service_1.InventoryService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('holdBed', () => {
        it('should throw BadRequestException if bed ID is not a valid ObjectId', async () => {
            await expect(service.holdBed('invalid-id', mockStudentId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if bed does not exist', async () => {
            mockBedModel.findById.mockResolvedValue(null);
            await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException if bed is not AVAILABLE', async () => {
            mockBedModel.findById.mockResolvedValue({
                ...mockBedDoc,
                permanentStatus: shared_types_1.BedStatus.OCCUPIED,
            });
            await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should return existing hold if current student already holds the bed', async () => {
            mockBedModel.findById.mockResolvedValue(mockBedDoc);
            mockRedisService.get.mockImplementation(async (key) => {
                if (key === `booking:hold:${mockBedId.toString()}`) {
                    return JSON.stringify({
                        holdId: 'existing-hold-id',
                        studentId: mockStudentId,
                        bedId: mockBedId.toString(),
                        expiresAt: new Date(Date.now() + 450000).toISOString(),
                    });
                }
                return null;
            });
            const result = await service.holdBed(mockBedId.toString(), mockStudentId);
            expect(result.holdId).toBe('existing-hold-id');
            expect(result.bedId).toBe(mockBedId.toString());
            expect(result.ttlSecondsRemaining).toBe(450);
        });
        it('should throw ConflictException if another student holds the bed', async () => {
            mockBedModel.findById.mockResolvedValue(mockBedDoc);
            mockRedisService.get.mockImplementation(async (key) => {
                if (key === `booking:hold:${mockBedId.toString()}`) {
                    return JSON.stringify({
                        holdId: 'other-hold-id',
                        studentId: mockOtherStudentId,
                        bedId: mockBedId.toString(),
                        expiresAt: new Date(Date.now() + 450000).toISOString(),
                    });
                }
                return null;
            });
            await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(common_1.ConflictException);
        });
        it('should successfully acquire hold with SET NX EX and release previous held bed', async () => {
            mockBedModel.findById.mockResolvedValue(mockBedDoc);
            const previousBedId = new mongoose_2.Types.ObjectId().toString();
            mockRedisService.get.mockImplementation(async (key) => {
                if (key === `booking:user_hold:${mockStudentId}`) {
                    return previousBedId;
                }
                return null; // Not currently held in booking:hold
            });
            mockRedisService.setNxEx.mockResolvedValue(true);
            mockRedisService.set.mockResolvedValue('OK');
            mockRedisService.del.mockResolvedValue(1);
            const result = await service.holdBed(mockBedId.toString(), mockStudentId, 480);
            expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${previousBedId}`);
            expect(mockRedisService.del).toHaveBeenCalledWith(`booking:user_hold:${mockStudentId}`);
            expect(mockRedisService.setNxEx).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`, expect.any(String), 480);
            expect(mockRedisService.set).toHaveBeenCalledWith(`booking:user_hold:${mockStudentId}`, mockBedId.toString(), 480);
            expect(result.bedId).toBe(mockBedId.toString());
            expect(result.ttlSecondsRemaining).toBe(480);
            expect(result.holdId).toBeDefined();
        });
        it('should throw ConflictException if atomic SET NX EX fails due to race condition', async () => {
            mockBedModel.findById.mockResolvedValue(mockBedDoc);
            mockRedisService.get.mockResolvedValue(null);
            mockRedisService.setNxEx.mockResolvedValue(false); // another worker acquired at exact same millisecond
            await expect(service.holdBed(mockBedId.toString(), mockStudentId)).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('releaseHold', () => {
        it('should return success if hold already expired', async () => {
            mockRedisService.get.mockResolvedValue(null);
            const result = await service.releaseHold(mockBedId.toString(), mockStudentId);
            expect(result.success).toBe(true);
        });
        it('should throw ForbiddenException if another student attempts to release hold', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({
                holdId: 'hold-123',
                studentId: mockOtherStudentId,
                bedId: mockBedId.toString(),
            }));
            await expect(service.releaseHold(mockBedId.toString(), mockStudentId)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should successfully delete keys when holding student releases hold', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({
                holdId: 'hold-123',
                studentId: mockStudentId,
                bedId: mockBedId.toString(),
            }));
            mockRedisService.del.mockResolvedValue(1);
            const result = await service.releaseHold(mockBedId.toString(), mockStudentId);
            expect(result.success).toBe(true);
            expect(mockRedisService.del).toHaveBeenCalledWith(`booking:hold:${mockBedId.toString()}`);
            expect(mockRedisService.del).toHaveBeenCalledWith(`booking:user_hold:${mockStudentId}`);
        });
    });
    describe('getBedHoldStatus', () => {
        it('should return isHeld: false when key does not exist', async () => {
            mockRedisService.get.mockResolvedValue(null);
            const result = await service.getBedHoldStatus(mockBedId.toString());
            expect(result.isHeld).toBe(false);
            expect(result.heldByCurrentStudent).toBe(false);
            expect(result.ttlRemaining).toBe(0);
        });
        it('should return isHeld: true and heldByCurrentStudent: true if student matches', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({
                holdId: 'hold-123',
                studentId: mockStudentId,
                bedId: mockBedId.toString(),
                expiresAt: '2026-10-18T22:30:00.000Z',
            }));
            mockRedisClient.ttl.mockResolvedValue(300);
            const result = await service.getBedHoldStatus(mockBedId.toString(), mockStudentId);
            expect(result.isHeld).toBe(true);
            expect(result.heldByCurrentStudent).toBe(true);
            expect(result.ttlRemaining).toBe(300);
            expect(result.expiresAt).toBe('2026-10-18T22:30:00.000Z');
        });
    });
});
//# sourceMappingURL=inventory.service.spec.js.map