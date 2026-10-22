import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  BedStatus,
  DynamicBedStatus,
  HoldResponse,
  BedHoldStatus,
  PropertyInventoryResponse,
  RoomType as SharedRoomType,
  Room as SharedRoom,
  Bed as SharedBed,
} from '@apna-ghar/shared-types';
import { RoomType, RoomTypeDocument } from './schemas/room-type.schema';
import { Room, RoomDocument } from './schemas/room.schema';
import { Bed, BedDocument } from './schemas/bed.schema';
import { RedisService } from '../../redis/redis.service';

interface StoredHoldPayload {
  holdId: string;
  studentId: string;
  bedId: string;
  createdAt: number;
  expiresAt: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly DEFAULT_HOLD_TTL = 480; // 8 minutes in seconds

  constructor(
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    private readonly redisService: RedisService,
  ) {}

  async getRoomTypesByProperty(propertyId: string | Types.ObjectId): Promise<RoomTypeDocument[]> {
    return this.roomTypeModel
      .find({ propertyId: new Types.ObjectId(propertyId) })
      .sort({ baseRent: 1 })
      .exec();
  }

  async getRoomsByProperty(propertyId: string | Types.ObjectId): Promise<RoomDocument[]> {
    return this.roomModel
      .find({ propertyId: new Types.ObjectId(propertyId) })
      .sort({ floorNumber: 1, roomNumber: 1 })
      .exec();
  }

  async getAvailableBedCount(propertyId: string | Types.ObjectId): Promise<number> {
    return this.bedModel.countDocuments({
      propertyId: new Types.ObjectId(propertyId),
      permanentStatus: BedStatus.AVAILABLE,
    });
  }

  /**
   * Returns complete structured inventory hierarchy (RoomTypes -> Rooms -> Beds)
   * enriched with real-time Redis bed hold statuses.
   */
  async getDetailedAvailability(
    propertyId: string | Types.ObjectId,
    currentUserId?: string,
  ): Promise<PropertyInventoryResponse> {
    const pId = new Types.ObjectId(propertyId);
    const roomTypes = await this.roomTypeModel.find({ propertyId: pId }).sort({ baseRent: 1 });
    const rooms = await this.roomModel.find({ propertyId: pId }).sort({ floorNumber: 1, roomNumber: 1 });
    const beds = await this.bedModel.find({ propertyId: pId }).sort({ bedLabel: 1 });

    const totalBeds = beds.length;

    // Check dynamic hold status for each bed from Redis
    const bedsWithDynamicStatus = await Promise.all(
      beds.map(async (bed) => {
        const bedJson = bed.toJSON();
        const bedIdStr = bed._id.toString();

        if (bed.permanentStatus !== BedStatus.AVAILABLE) {
          return {
            ...bedJson,
            dynamicStatus: (bed.permanentStatus === BedStatus.BOOKED || bed.permanentStatus === BedStatus.OCCUPIED
              ? 'OCCUPIED'
              : 'MAINTENANCE') as DynamicBedStatus,
          };
        }

        const holdKey = `booking:hold:${bedIdStr}`;
        const holdRaw = await this.redisService.get(holdKey);

        if (holdRaw) {
          try {
            const holdPayload: StoredHoldPayload = JSON.parse(holdRaw);
            const isHeldByMe = currentUserId ? holdPayload.studentId === currentUserId : false;
            return {
              ...bedJson,
              dynamicStatus: (isHeldByMe ? 'HELD_BY_YOU' : 'HELD_BY_OTHER') as DynamicBedStatus,
            };
          } catch {
            return {
              ...bedJson,
              dynamicStatus: 'HELD_BY_OTHER' as DynamicBedStatus,
            };
          }
        }

        return {
          ...bedJson,
          dynamicStatus: 'AVAILABLE' as DynamicBedStatus,
        };
      }),
    );

    const availableBeds = bedsWithDynamicStatus.filter(
      (b) => b.dynamicStatus === 'AVAILABLE' || b.dynamicStatus === 'HELD_BY_YOU',
    ).length;

    // Structure hierarchy: RoomType -> Rooms -> Beds
    const structuredRoomTypes = roomTypes.map((rt) => {
      const typeRooms = rooms.filter((r) => r.roomTypeId.toString() === rt._id.toString());
      const roomsWithBeds = typeRooms.map((room) => {
        const roomBeds = bedsWithDynamicStatus.filter((b) => b.roomId.toString() === room._id.toString());
        return {
          room: room.toJSON() as unknown as SharedRoom,
          beds: roomBeds as unknown as SharedBed[],
        };
      });

      const typeBeds = bedsWithDynamicStatus.filter((b) => b.roomTypeId.toString() === rt._id.toString());
      const availableTypeBeds = typeBeds.filter(
        (b) => b.dynamicStatus === 'AVAILABLE' || b.dynamicStatus === 'HELD_BY_YOU',
      ).length;

      return {
        roomType: rt.toJSON() as unknown as SharedRoomType,
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
  async holdBed(bedId: string, studentId: string, ttlSeconds = this.DEFAULT_HOLD_TTL): Promise<HoldResponse> {
    if (!Types.ObjectId.isValid(bedId)) {
      throw new BadRequestException('Invalid bed ID format.');
    }

    const bed = await this.bedModel.findById(bedId);
    if (!bed) {
      throw new NotFoundException('Bed not found.');
    }

    if (bed.permanentStatus !== BedStatus.AVAILABLE) {
      throw new BadRequestException('This bed is not available for reservation.');
    }

    const holdKey = `booking:hold:${bedId}`;
    const userHoldKey = `booking:user_hold:${studentId}`;

    // Check if bed is already held
    const existingHoldRaw = await this.redisService.get(holdKey);
    if (existingHoldRaw) {
      try {
        const existingHold: StoredHoldPayload = JSON.parse(existingHoldRaw);
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
      } catch {
        // Corrupted payload fallback: treat as held by another
      }
      throw new ConflictException(
        'This bed is currently reserved by another student. Please select another bed or try again shortly.',
      );
    }

    // Release any previous bed held by this student (single bed hold per student guarantee)
    const previousBedId = await this.redisService.get(userHoldKey);
    if (previousBedId && previousBedId !== bedId) {
      await this.redisService.del(`booking:hold:${previousBedId}`);
      await this.redisService.del(userHoldKey);
    }

    const holdId = randomUUID();
    const now = Date.now();
    const expiresAt = new Date(now + ttlSeconds * 1000).toISOString();
    const payload: StoredHoldPayload = {
      holdId,
      studentId,
      bedId,
      createdAt: now,
      expiresAt,
    };

    // Ensure production distributed safety: reject unsafe hold if Redis is degraded
    if (
      process.env.NODE_ENV === 'production' &&
      !this.redisService.isLive() &&
      process.env.ALLOW_REDIS_MOCK !== 'true'
    ) {
      throw new ConflictException(
        'Managed Redis distributed lock is unavailable in production. Temporary holds cannot be guaranteed.',
      );
    }

    // Atomic acquisition with SET NX EX
    const acquired = await this.redisService.setNxEx(holdKey, JSON.stringify(payload), ttlSeconds);
    if (!acquired) {
      throw new ConflictException(
        'This bed was just reserved by another student. Please select another bed.',
      );
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
  async releaseHold(bedId: string, studentId: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(bedId)) {
      throw new BadRequestException('Invalid bed ID format.');
    }

    const holdKey = `booking:hold:${bedId}`;
    const userHoldKey = `booking:user_hold:${studentId}`;

    const existingHoldRaw = await this.redisService.get(holdKey);
    if (!existingHoldRaw) {
      await this.redisService.del(userHoldKey);
      return { success: true, message: 'Hold has already expired or been released.' };
    }

    try {
      const existingHold: StoredHoldPayload = JSON.parse(existingHoldRaw);
      if (existingHold.studentId !== studentId) {
        throw new ForbiddenException('You do not have permission to release this bed reservation.');
      }
    } catch (err: unknown) {
      if (err instanceof ForbiddenException) throw err;
    }

    await this.redisService.del(holdKey);
    await this.redisService.del(userHoldKey);

    this.logger.log(`Bed ${bedId} hold released by student ${studentId}`);
    return { success: true, message: 'Bed hold released successfully.' };
  }

  /**
   * Retrieves the current hold status for a specific bed.
   */
  async getBedHoldStatus(bedId: string, currentUserId?: string): Promise<BedHoldStatus> {
    if (!Types.ObjectId.isValid(bedId)) {
      throw new BadRequestException('Invalid bed ID format.');
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
      const parsed: StoredHoldPayload = JSON.parse(holdRaw);
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
    } catch {
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
  async getUserActiveHold(studentId: string) {
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

  async updateBedStatus(bedId: string | Types.ObjectId, status: BedStatus): Promise<BedDocument> {
    const bed = await this.bedModel.findByIdAndUpdate(
      bedId,
      { $set: { permanentStatus: status } },
      { new: true },
    );
    if (!bed) {
      throw new NotFoundException('Bed not found.');
    }
    return bed;
  }
}
