import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BedStatus } from '@apna-ghar/shared-types';
import { RoomType, RoomTypeDocument } from './schemas/room-type.schema';
import { Room, RoomDocument } from './schemas/room.schema';
import { Bed, BedDocument } from './schemas/bed.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
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

  async getDetailedAvailability(propertyId: string | Types.ObjectId) {
    const pId = new Types.ObjectId(propertyId);
    const roomTypes = await this.roomTypeModel.find({ propertyId: pId }).sort({ baseRent: 1 });
    const rooms = await this.roomModel.find({ propertyId: pId }).sort({ floorNumber: 1, roomNumber: 1 });
    const beds = await this.bedModel.find({ propertyId: pId }).sort({ bedLabel: 1 });

    const totalBeds = beds.length;
    const availableBeds = beds.filter((b) => b.permanentStatus === BedStatus.AVAILABLE).length;

    // Structure hierarchy: RoomType -> Rooms -> Beds
    const structuredRoomTypes = roomTypes.map((rt) => {
      const typeRooms = rooms.filter((r) => r.roomTypeId.toString() === rt._id.toString());
      const roomsWithBeds = typeRooms.map((room) => {
        const roomBeds = beds.filter((b) => b.roomId.toString() === room._id.toString());
        return {
          room: room.toJSON(),
          beds: roomBeds.map((b) => b.toJSON()),
        };
      });

      const typeBeds = beds.filter((b) => b.roomTypeId.toString() === rt._id.toString());
      const availableTypeBeds = typeBeds.filter((b) => b.permanentStatus === BedStatus.AVAILABLE).length;

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
