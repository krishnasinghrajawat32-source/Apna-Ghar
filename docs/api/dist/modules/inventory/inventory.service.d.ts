import { Model, Types } from 'mongoose';
import { BedStatus, HoldResponse, BedHoldStatus, PropertyInventoryResponse } from '@apna-ghar/shared-types';
import { RoomTypeDocument } from './schemas/room-type.schema';
import { RoomDocument } from './schemas/room.schema';
import { BedDocument } from './schemas/bed.schema';
import { RedisService } from '../../redis/redis.service';
export declare class InventoryService {
    private readonly roomTypeModel;
    private readonly roomModel;
    private readonly bedModel;
    private readonly redisService;
    private readonly logger;
    private readonly DEFAULT_HOLD_TTL;
    constructor(roomTypeModel: Model<RoomTypeDocument>, roomModel: Model<RoomDocument>, bedModel: Model<BedDocument>, redisService: RedisService);
    getRoomTypesByProperty(propertyId: string | Types.ObjectId): Promise<RoomTypeDocument[]>;
    getRoomsByProperty(propertyId: string | Types.ObjectId): Promise<RoomDocument[]>;
    getAvailableBedCount(propertyId: string | Types.ObjectId): Promise<number>;
    /**
     * Returns complete structured inventory hierarchy (RoomTypes -> Rooms -> Beds)
     * enriched with real-time Redis bed hold statuses.
     */
    getDetailedAvailability(propertyId: string | Types.ObjectId, currentUserId?: string): Promise<PropertyInventoryResponse>;
    /**
     * Atomically holds a bed for a student for ttlSeconds (default 8 minutes).
     * Concurrency protected via Redis SET NX EX.
     */
    holdBed(bedId: string, studentId: string, ttlSeconds?: number): Promise<HoldResponse>;
    /**
     * Releases an active bed hold early if student deselects or changes mind.
     */
    releaseHold(bedId: string, studentId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Retrieves the current hold status for a specific bed.
     */
    getBedHoldStatus(bedId: string, currentUserId?: string): Promise<BedHoldStatus>;
    /**
     * Retrieves the student's currently active bed hold (if any).
     */
    getUserActiveHold(studentId: string): Promise<{
        bed: import("mongoose").FlattenMaps<BedDocument> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
        hold: BedHoldStatus;
    } | null>;
    updateBedStatus(bedId: string | Types.ObjectId, status: BedStatus): Promise<BedDocument>;
}
//# sourceMappingURL=inventory.service.d.ts.map