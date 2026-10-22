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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const shared_types_1 = require("@apna-ghar/shared-types");
const room_type_schema_1 = require("./schemas/room-type.schema");
const room_schema_1 = require("./schemas/room.schema");
const bed_schema_1 = require("./schemas/bed.schema");
const redis_service_1 = require("../../redis/redis.service");
let InventoryService = InventoryService_1 = class InventoryService {
    roomTypeModel;
    roomModel;
    bedModel;
    redisService;
    logger = new common_1.Logger(InventoryService_1.name);
    DEFAULT_HOLD_TTL = 480; // 8 minutes in seconds
    constructor(roomTypeModel, roomModel, bedModel, redisService) {
        this.roomTypeModel = roomTypeModel;
        this.roomModel = roomModel;
        this.bedModel = bedModel;
        this.redisService = redisService;
    }
    async getRoomTypesByProperty(propertyId) {
        return this.roomTypeModel
            .find({ propertyId: new mongoose_2.Types.ObjectId(propertyId) })
            .sort({ baseRent: 1 })
            .exec();
    }
    async getRoomsByProperty(propertyId) {
        return this.roomModel
            .find({ propertyId: new mongoose_2.Types.ObjectId(propertyId) })
            .sort({ floorNumber: 1, roomNumber: 1 })
            .exec();
    }
    async getAvailableBedCount(propertyId) {
        return this.bedModel.countDocuments({
            propertyId: new mongoose_2.Types.ObjectId(propertyId),
            permanentStatus: shared_types_1.BedStatus.AVAILABLE,
        });
    }
    /**
     * Returns complete structured inventory hierarchy (RoomTypes -> Rooms -> Beds)
     * enriched with real-time Redis bed hold statuses.
     */
    async getDetailedAvailability(propertyId, currentUserId) {
        const pId = new mongoose_2.Types.ObjectId(propertyId);
        const roomTypes = await this.roomTypeModel.find({ propertyId: pId }).sort({ baseRent: 1 });
        const rooms = await this.roomModel.find({ propertyId: pId }).sort({ floorNumber: 1, roomNumber: 1 });
        const beds = await this.bedModel.find({ propertyId: pId }).sort({ bedLabel: 1 });
        const totalBeds = beds.length;
        // Check dynamic hold status for each bed from Redis
        const bedsWithDynamicStatus = await Promise.all(beds.map(async (bed) => {
            const bedJson = bed.toJSON();
            const bedIdStr = bed._id.toString();
            if (bed.permanentStatus !== shared_types_1.BedStatus.AVAILABLE) {
                return {
                    ...bedJson,
                    dynamicStatus: (bed.permanentStatus === shared_types_1.BedStatus.BOOKED || bed.permanentStatus === shared_types_1.BedStatus.OCCUPIED
                        ? 'OCCUPIED'
                        : 'MAINTENANCE'),
                };
            }
            const holdKey = `booking:hold:${bedIdStr}`;
            const holdRaw = await this.redisService.get(holdKey);
            if (holdRaw) {
                try {
                    const holdPayload = JSON.parse(holdRaw);
                    const isHeldByMe = currentUserId ? holdPayload.studentId === currentUserId : false;
                    return {
                        ...bedJson,
                        dynamicStatus: (isHeldByMe ? 'HELD_BY_YOU' : 'HELD_BY_OTHER'),
                    };
                }
                catch {
                    return {
                        ...bedJson,
                        dynamicStatus: 'HELD_BY_OTHER',
                    };
                }
            }
            return {
                ...bedJson,
                dynamicStatus: 'AVAILABLE',
            };
        }));
        const availableBeds = bedsWithDynamicStatus.filter((b) => b.dynamicStatus === 'AVAILABLE' || b.dynamicStatus === 'HELD_BY_YOU').length;
        // Structure hierarchy: RoomType -> Rooms -> Beds
        const structuredRoomTypes = roomTypes.map((rt) => {
            const typeRooms = rooms.filter((r) => r.roomTypeId.toString() === rt._id.toString());
            const roomsWithBeds = typeRooms.map((room) => {
                const roomBeds = bedsWithDynamicStatus.filter((b) => b.roomId.toString() === room._id.toString());
                return {
                    room: room.toJSON(),
                    beds: roomBeds,
                };
            });
            const typeBeds = bedsWithDynamicStatus.filter((b) => b.roomTypeId.toString() === rt._id.toString());
            const availableTypeBeds = typeBeds.filter((b) => b.dynamicStatus === 'AVAILABLE' || b.dynamicStatus === 'HELD_BY_YOU').length;
            return {
                roomType: rt.toJSON(),
                availableBedsCount: availableTypeBeds,
                totalBedsCount: typeBeds.length,
                rooms: roomsWithBeds,
            };
        });
        return {
            propertyId: propertyId.toString(),
            totalBeds,
            availableBeds,
            inventory: structuredRoomTypes,
        };
    }
    /**
     * Atomically holds a bed for a student for ttlSeconds (default 8 minutes).
     * Concurrency protected via Redis SET NX EX.
     */
    async holdBed(bedId, studentId, ttlSeconds = this.DEFAULT_HOLD_TTL) {
        if (!mongoose_2.Types.ObjectId.isValid(bedId)) {
            throw new common_1.BadRequestException('Invalid bed ID format.');
        }
        const bed = await this.bedModel.findById(bedId);
        if (!bed) {
            throw new common_1.NotFoundException('Bed not found.');
        }
        if (bed.permanentStatus !== shared_types_1.BedStatus.AVAILABLE) {
            throw new common_1.BadRequestException('This bed is not available for reservation.');
        }
        const holdKey = `booking:hold:${bedId}`;
        const userHoldKey = `booking:user_hold:${studentId}`;
        // Check if bed is already held
        const existingHoldRaw = await this.redisService.get(holdKey);
        if (existingHoldRaw) {
            try {
                const existingHold = JSON.parse(existingHoldRaw);
                if (existingHold.studentId === studentId) {
                    // Student already holds this bed; return current remaining TTL
                    const remainingTtl = await this.redisService.getClient().ttl(holdKey);
                    return {
                        holdId: existingHold.holdId,
                        bedId,
                        expiresAt: existingHold.expiresAt,
                        ttlSecondsRemaining: remainingTtl > 0 ? remainingTtl : 0,
                    };
                }
            }
            catch {
                // Corrupted payload fallback: treat as held by another
            }
            throw new common_1.ConflictException('This bed is currently reserved by another student. Please select another bed or try again shortly.');
        }
        // Release any previous bed held by this student (single bed hold per student guarantee)
        const previousBedId = await this.redisService.get(userHoldKey);
        if (previousBedId && previousBedId !== bedId) {
            await this.redisService.del(`booking:hold:${previousBedId}`);
            await this.redisService.del(userHoldKey);
        }
        const holdId = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const expiresAt = new Date(now + ttlSeconds * 1000).toISOString();
        const payload = {
            holdId,
            studentId,
            bedId,
            createdAt: now,
            expiresAt,
        };
        // Ensure production distributed safety: reject unsafe hold if Redis is degraded
        if (process.env.NODE_ENV === 'production' &&
            !this.redisService.isLive() &&
            process.env.ALLOW_REDIS_MOCK !== 'true') {
            throw new common_1.ConflictException('Managed Redis distributed lock is unavailable in production. Temporary holds cannot be guaranteed.');
        }
        // Atomic acquisition with SET NX EX
        const acquired = await this.redisService.setNxEx(holdKey, JSON.stringify(payload), ttlSeconds);
        if (!acquired) {
            throw new common_1.ConflictException('This bed was just reserved by another student. Please select another bed.');
        }
        // Record user to bed index
        await this.redisService.set(userHoldKey, bedId, ttlSeconds);
        this.logger.log(`Bed ${bedId} held by student ${studentId} for ${ttlSeconds}s (holdId: ${holdId})`);
        return {
            holdId,
            bedId,
            expiresAt,
            ttlSecondsRemaining: ttlSeconds,
        };
    }
    /**
     * Releases an active bed hold early if student deselects or changes mind.
     */
    async releaseHold(bedId, studentId) {
        if (!mongoose_2.Types.ObjectId.isValid(bedId)) {
            throw new common_1.BadRequestException('Invalid bed ID format.');
        }
        const holdKey = `booking:hold:${bedId}`;
        const userHoldKey = `booking:user_hold:${studentId}`;
        const existingHoldRaw = await this.redisService.get(holdKey);
        if (!existingHoldRaw) {
            await this.redisService.del(userHoldKey);
            return { success: true, message: 'Hold has already expired or been released.' };
        }
        try {
            const existingHold = JSON.parse(existingHoldRaw);
            if (existingHold.studentId !== studentId) {
                throw new common_1.ForbiddenException('You do not have permission to release this bed reservation.');
            }
        }
        catch (err) {
            if (err instanceof common_1.ForbiddenException)
                throw err;
        }
        await this.redisService.del(holdKey);
        await this.redisService.del(userHoldKey);
        this.logger.log(`Bed ${bedId} hold released by student ${studentId}`);
        return { success: true, message: 'Bed hold released successfully.' };
    }
    /**
     * Retrieves the current hold status for a specific bed.
     */
    async getBedHoldStatus(bedId, currentUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(bedId)) {
            throw new common_1.BadRequestException('Invalid bed ID format.');
        }
        const holdKey = `booking:hold:${bedId}`;
        const holdRaw = await this.redisService.get(holdKey);
        if (!holdRaw) {
            return {
                isHeld: false,
                heldByCurrentStudent: false,
                ttlRemaining: 0,
                bedId,
            };
        }
        try {
            const parsed = JSON.parse(holdRaw);
            const ttl = await this.redisService.getClient().ttl(holdKey);
            const ttlRemaining = ttl > 0 ? ttl : 0;
            const heldByCurrentStudent = currentUserId ? parsed.studentId === currentUserId : false;
            return {
                isHeld: true,
                heldByCurrentStudent,
                ttlRemaining,
                expiresAt: parsed.expiresAt,
                bedId,
            };
        }
        catch {
            return {
                isHeld: true,
                heldByCurrentStudent: false,
                ttlRemaining: 0,
                bedId,
            };
        }
    }
    /**
     * Retrieves the student's currently active bed hold (if any).
     */
    async getUserActiveHold(studentId) {
        const userHoldKey = `booking:user_hold:${studentId}`;
        const bedId = await this.redisService.get(userHoldKey);
        if (!bedId) {
            return null;
        }
        const bed = await this.bedModel
            .findById(bedId)
            .populate('roomId')
            .populate('roomTypeId')
            .populate('propertyId')
            .exec();
        if (!bed) {
            await this.redisService.del(userHoldKey);
            return null;
        }
        const holdStatus = await this.getBedHoldStatus(bedId, studentId);
        if (!holdStatus.isHeld || !holdStatus.heldByCurrentStudent) {
            await this.redisService.del(userHoldKey);
            return null;
        }
        return {
            bed: bed.toJSON(),
            hold: holdStatus,
        };
    }
    async updateBedStatus(bedId, status) {
        const bed = await this.bedModel.findByIdAndUpdate(bedId, { $set: { permanentStatus: status } }, { new: true });
        if (!bed) {
            throw new common_1.NotFoundException('Bed not found.');
        }
        return bed;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(room_type_schema_1.RoomType.name)),
    __param(1, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __param(2, (0, mongoose_1.InjectModel)(bed_schema_1.Bed.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map