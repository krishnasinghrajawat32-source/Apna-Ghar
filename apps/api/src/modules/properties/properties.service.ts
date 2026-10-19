import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { InventoryService } from '../inventory/inventory.service';
import { RoomType, RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { Room, RoomDocument } from '../inventory/schemas/room.schema';
import { Bed, BedDocument } from '../inventory/schemas/bed.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  PropertyType,
  GenderPreference,
  FurnishingType,
  PropertyStatus,
  SharingType,
  BedStatus,
} from '@apna-ghar/shared-types';

@Injectable()
export class PropertiesService implements OnModuleInit {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  async onModuleInit() {
    const isConnected = !this.propertyModel.db || this.propertyModel.db.readyState === 1;
    if (isConnected) {
      await this.seedInitialProperties();
    } else {
      this.propertyModel.db.once('connected', () => {
        this.seedInitialProperties().catch((err) => {
          this.logger.warn(`Properties seeding skipped or deferred: ${err.message}`);
        });
      });
    }
  }

  async findBySlug(slug: string) {
    const property = await this.propertyModel
      .findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' })
      .exec();
    if (!property) {
      throw new NotFoundException(`Property with slug '${slug}' not found.`);
    }

    const roomTypes = await this.inventoryService.getRoomTypesByProperty(property._id);
    const availableBedCount = await this.inventoryService.getAvailableBedCount(property._id);

    return {
      property: property.toJSON(),
      roomTypes: roomTypes.map((rt) => rt.toJSON()),
      availableBedCount,
    };
  }

  async findById(id: string | Types.ObjectId): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) {
      throw new NotFoundException('Property not found.');
    }
    return property;
  }

  async getRooms(propertyId: string | Types.ObjectId) {
    const pId = new Types.ObjectId(propertyId);
    const roomTypes = await this.inventoryService.getRoomTypesByProperty(pId);
    const rooms = await this.inventoryService.getRoomsByProperty(pId);

    return {
      roomTypes: roomTypes.map((rt) => rt.toJSON()),
      rooms: rooms.map((r) => r.toJSON()),
    };
  }

  async getAvailability(propertyId: string | Types.ObjectId) {
    return this.inventoryService.getDetailedAvailability(propertyId);
  }

  private async seedInitialProperties() {
    try {
      const count = await this.propertyModel.countDocuments();
      if (count > 0) return;

      this.logger.log('Seeding initial verified student accommodation records near universities...');

    // Find or create an owner user
    let owner = await this.userModel.findOne({ email: 'owner.verified@apnaghar.com' });
    if (!owner) {
      owner = await this.userModel.create({
        name: 'Virendra Singh',
        email: 'owner.verified@apnaghar.com',
        phone: '+919811223344',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        role: 'OWNER',
      });
    }

    // 1. Property near Amity University Noida (approx 800m away)
    // Amity Coords: [77.3331, 28.5434]
    // Property 1: Sector 125, Noida [77.3315, 28.5412]
    const p1 = await this.propertyModel.create({
      ownerId: owner._id,
      name: 'Greenwood Student Residency',
      slug: 'greenwood-student-residency-noida',
      propertyType: PropertyType.PG,
      description:
        'Premium student accommodation located 800 meters from Amity University Gate 2. Features high-speed Wi-Fi, 4-tier security, hygienic meals, biometric entry, and power backup.',
      address: {
        street: 'Plot 42, Sector 125',
        landmark: 'Near Amity Gate 2',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
      },
      location: {
        type: 'Point',
        coordinates: [77.3315, 28.5412], // ~800 meters from Amity
      },
      genderPreference: GenderPreference.BOYS,
      furnishing: FurnishingType.FULLY_FURNISHED,
      status: PropertyStatus.ACTIVE,
      isFullyVerified: true,
      amenities: ['wifi', 'ac', 'food', 'laundry', 'cctv', 'power_backup', 'parking'],
      rules: ['No loud music after 10 PM', 'Visitor hours 10 AM - 7 PM', 'Smoking strictly prohibited'],
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
      ],
      lastAvailabilityUpdatedAt: new Date(Date.now() - 35 * 60 * 1000), // Updated 35 mins ago -> FRESH
    });

    // Room Types for P1
    const p1Single = await this.roomTypeModel.create({
      propertyId: p1._id,
      name: 'Deluxe Single Occupancy',
      sharingType: SharingType.SINGLE,
      baseRent: 14000,
      deposit: 14000,
      attachedBathroom: true,
      ac: true,
      foodIncluded: true,
      furnishingDetails: ['Single Box Bed', 'Study Desk', 'Ergonomic Chair', 'Wardrobe', 'Balcony'],
    });

    const p1Double = await this.roomTypeModel.create({
      propertyId: p1._id,
      name: 'Twin Sharing Room',
      sharingType: SharingType.DOUBLE,
      baseRent: 8500,
      deposit: 8500,
      attachedBathroom: true,
      ac: true,
      foodIncluded: true,
      furnishingDetails: ['Two Single Beds', 'Dual Study Desks', 'Individual Wardrobes', 'Curtains'],
    });

    // Rooms & Beds for P1
    const room101 = await this.roomModel.create({
      propertyId: p1._id,
      roomTypeId: p1Single._id,
      floorNumber: 1,
      roomNumber: '101',
      status: 'ACTIVE',
    });

    await this.bedModel.create({
      propertyId: p1._id,
      roomId: room101._id,
      roomTypeId: p1Single._id,
      bedLabel: 'Bed 101-A',
      permanentStatus: BedStatus.AVAILABLE,
    });

    const room102 = await this.roomModel.create({
      propertyId: p1._id,
      roomTypeId: p1Double._id,
      floorNumber: 1,
      roomNumber: '102',
      status: 'ACTIVE',
    });

    await this.bedModel.create([
      {
        propertyId: p1._id,
        roomId: room102._id,
        roomTypeId: p1Double._id,
        bedLabel: 'Bed 102-A',
        permanentStatus: BedStatus.AVAILABLE,
      },
      {
        propertyId: p1._id,
        roomId: room102._id,
        roomTypeId: p1Double._id,
        bedLabel: 'Bed 102-B',
        permanentStatus: BedStatus.OCCUPIED,
      },
    ]);

    // 2. Property near IIT Delhi (approx 1.2km away)
    // IIT Delhi coords: [77.1926, 28.545]
    // Property 2: Hauz Khas [77.201, 28.548]
    const p2 = await this.propertyModel.create({
      ownerId: owner._id,
      name: 'Scholars Nest Girls Hostel',
      slug: 'scholars-nest-girls-hostel-hauz-khas',
      propertyType: PropertyType.HOSTEL,
      description:
        'Secure girls accommodation walking distance from IIT Delhi. Includes 24/7 biometric security, certified in-house mess, library study lounge, and daily housekeeping.',
      address: {
        street: 'Hauz Khas Enclave',
        landmark: 'Opposite Metro Gate 3',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110016',
      },
      location: {
        type: 'Point',
        coordinates: [77.201, 28.548],
      },
      genderPreference: GenderPreference.GIRLS,
      furnishing: FurnishingType.FULLY_FURNISHED,
      status: PropertyStatus.ACTIVE,
      isFullyVerified: true,
      amenities: ['wifi', 'ac', 'food', 'laundry', 'cctv', 'power_backup'],
      rules: ['Curfew: 9:30 PM', 'No outside male visitors in rooms', 'Quiet hours from 11 PM'],
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      ],
      lastAvailabilityUpdatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Updated 4 hours ago -> FRESH
    });

    const p2Double = await this.roomTypeModel.create({
      propertyId: p2._id,
      name: 'Standard Twin Sharing',
      sharingType: SharingType.DOUBLE,
      baseRent: 9500,
      deposit: 9500,
      attachedBathroom: true,
      ac: true,
      foodIncluded: true,
      furnishingDetails: ['Bed with Mattress', 'Study Table', 'Cupboard'],
    });

    const room201 = await this.roomModel.create({
      propertyId: p2._id,
      roomTypeId: p2Double._id,
      floorNumber: 2,
      roomNumber: '201',
      status: 'ACTIVE',
    });

    await this.bedModel.create([
      {
        propertyId: p2._id,
        roomId: room201._id,
        roomTypeId: p2Double._id,
        bedLabel: 'Bed 201-Left',
        permanentStatus: BedStatus.AVAILABLE,
      },
      {
        propertyId: p2._id,
        roomId: room201._id,
        roomTypeId: p2Double._id,
        bedLabel: 'Bed 201-Right',
        permanentStatus: BedStatus.AVAILABLE,
      },
    ]);

    this.logger.log('Successfully seeded 2 verified student accommodation records with rooms and beds.');
    } catch (err: any) {
      this.logger.warn(`Initial properties seeding skipped or deferred: ${err.message}`);
    }
  }
}
