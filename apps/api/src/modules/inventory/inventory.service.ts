import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { BedStatus } from '@apnaghar/shared-types';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRoomType(ownerUserId: string, propertyId: string, dto: CreateRoomTypeDto) {
    await this.verifyPropertyOwnership(ownerUserId, propertyId);

    return this.prisma.roomType.create({
      data: {
        property: { connect: { id: propertyId } },
        name: dto.name,
        sharingCount: dto.sharingCount,
        baseRent: new Prisma.Decimal(dto.baseRent),
        hasAttachedBath: dto.hasAttachedBath,
        hasBalcony: dto.hasBalcony,
        hasAirCondition: dto.hasAirCondition,
      },
    });
  }

  async createRoom(
    ownerUserId: string,
    propertyId: string,
    roomTypeId: string,
    dto: CreateRoomDto,
  ) {
    await this.verifyPropertyOwnership(ownerUserId, propertyId);

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });

    if (!roomType || roomType.propertyId !== propertyId) {
      throw new NotFoundException('Room type does not belong to this property.');
    }

    if (dto.bedIdentifiers.length !== roomType.sharingCount) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'BED_COUNT_MISMATCH',
          message: `Room type '${roomType.name}' specifies sharingCount=${roomType.sharingCount}, but ${dto.bedIdentifiers.length} bed identifiers were provided.`,
        },
      });
    }

    // Atomic room and atomic beds creation
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          roomType: { connect: { id: roomTypeId } },
          roomNumber: dto.roomNumber,
          floor: dto.floor,
          beds: {
            create: dto.bedIdentifiers.map((identifier) => ({
              bedIdentifier: identifier,
              status: 'AVAILABLE',
            })),
          },
        },
        include: {
          beds: true,
        },
      });

      return room;
    });
  }

  async updateBedStatus(ownerUserId: string, bedId: string, newStatus: BedStatus) {
    const bed = await this.prisma.bed.findUnique({
      where: { id: bedId },
      include: {
        room: {
          include: {
            roomType: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException('Bed not found.');
    }

    const property = bed.room.roomType.property;
    await this.verifyPropertyOwnership(ownerUserId, property.id);

    // Prevent overriding a bed that is currently occupied or reserved under an active booking
    if (bed.status === 'RESERVED' || bed.status === 'OCCUPIED') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'BED_HAS_ACTIVE_STAY',
          message: `Cannot change status of a bed that is currently ${bed.status}. Please resolve the tenant booking first.`,
        },
      });
    }

    return this.prisma.bed.update({
      where: { id: bedId },
      data: { status: newStatus as any },
    });
  }

  async getInventoryHierarchy(propertyId: string) {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId },
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
      },
      orderBy: { baseRent: 'asc' },
    });

    let totalBeds = 0;
    let availableBeds = 0;
    let heldBeds = 0;
    let reservedBeds = 0;
    let occupiedBeds = 0;
    let maintenanceBeds = 0;

    const formattedRoomTypes = roomTypes.map((rt) => {
      let rtTotal = 0;
      let rtAvailable = 0;

      const formattedRooms = rt.rooms.map((r) => {
        let rTotal = 0;
        let rAvailable = 0;

        r.beds.forEach((b) => {
          rTotal++;
          rtTotal++;
          totalBeds++;

          switch (b.status) {
            case 'AVAILABLE':
              rAvailable++;
              rtAvailable++;
              availableBeds++;
              break;
            case 'TEMPORARILY_HELD':
              heldBeds++;
              break;
            case 'RESERVED':
              reservedBeds++;
              break;
            case 'OCCUPIED':
              occupiedBeds++;
              break;
            case 'MAINTENANCE':
            case 'INACTIVE':
              maintenanceBeds++;
              break;
          }
        });

        return {
          id: r.id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          totalBeds: rTotal,
          availableBeds: rAvailable,
          beds: r.beds.map((b) => ({
            id: b.id,
            bedIdentifier: b.bedIdentifier,
            status: b.status,
            holdExpiresAt: b.holdExpiresAt,
          })),
        };
      });

      return {
        id: rt.id,
        name: rt.name,
        sharingCount: rt.sharingCount,
        baseRent: Number(rt.baseRent),
        totalBeds: rtTotal,
        availableBeds: rtAvailable,
        rooms: formattedRooms,
      };
    });

    return {
      summary: {
        totalBeds,
        availableBeds,
        heldBeds,
        reservedBeds,
        occupiedBeds,
        maintenanceBeds,
        occupancyPercentage: totalBeds > 0 ? Math.round(((occupiedBeds + reservedBeds) / totalBeds) * 100) : 0,
      },
      roomTypes: formattedRoomTypes,
    };
  }

  private async verifyPropertyOwnership(ownerUserId: string, propertyId: string) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException('Owner profile not found.');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== owner.id) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PROPERTY_FORBIDDEN',
          message: 'You do not have permission to modify inventory for this property.',
        },
      });
    }

    return property;
  }
}
