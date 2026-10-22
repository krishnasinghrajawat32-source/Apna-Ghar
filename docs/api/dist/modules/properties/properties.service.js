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
var PropertiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const property_schema_1 = require("./schemas/property.schema");
const inventory_service_1 = require("../inventory/inventory.service");
const room_type_schema_1 = require("../inventory/schemas/room-type.schema");
const room_schema_1 = require("../inventory/schemas/room.schema");
const bed_schema_1 = require("../inventory/schemas/bed.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
let PropertiesService = PropertiesService_1 = class PropertiesService {
    propertyModel;
    roomTypeModel;
    roomModel;
    bedModel;
    userModel;
    inventoryService;
    logger = new common_1.Logger(PropertiesService_1.name);
    constructor(propertyModel, roomTypeModel, roomModel, bedModel, userModel, inventoryService) {
        this.propertyModel = propertyModel;
        this.roomTypeModel = roomTypeModel;
        this.roomModel = roomModel;
        this.bedModel = bedModel;
        this.userModel = userModel;
        this.inventoryService = inventoryService;
    }
    async onModuleInit() {
        const isConnected = !this.propertyModel.db || this.propertyModel.db.readyState === 1;
        if (isConnected) {
            await this.seedInitialProperties();
        }
        else {
            this.propertyModel.db.once('connected', () => {
                this.seedInitialProperties().catch((err) => {
                    this.logger.warn(`Properties seeding skipped or deferred: ${err.message}`);
                });
            });
        }
    }
    async findBySlug(slug) {
        const property = await this.propertyModel
            .findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' })
            .exec();
        if (!property) {
            throw new common_1.NotFoundException(`Property with slug '${slug}' not found.`);
        }
        const roomTypes = await this.inventoryService.getRoomTypesByProperty(property._id);
        const availableBedCount = await this.inventoryService.getAvailableBedCount(property._id);
        return {
            property: property.toJSON(),
            roomTypes: roomTypes.map((rt) => rt.toJSON()),
            availableBedCount,
        };
    }
    async findById(id) {
        const property = await this.propertyModel.findById(id).exec();
        if (!property) {
            throw new common_1.NotFoundException('Property not found.');
        }
        return property;
    }
    async getRooms(propertyId) {
        const pId = new mongoose_2.Types.ObjectId(propertyId);
        const roomTypes = await this.inventoryService.getRoomTypesByProperty(pId);
        const rooms = await this.inventoryService.getRoomsByProperty(pId);
        return {
            roomTypes: roomTypes.map((rt) => rt.toJSON()),
            rooms: rooms.map((r) => r.toJSON()),
        };
    }
    async getAvailability(propertyId) {
        return this.inventoryService.getDetailedAvailability(propertyId);
    }
    async seedInitialProperties() {
        try {
            const count = await this.propertyModel.countDocuments();
            if (count > 0)
                return;
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
                propertyType: shared_types_1.PropertyType.PG,
                description: 'Premium student accommodation located 800 meters from Amity University Gate 2. Features high-speed Wi-Fi, 4-tier security, hygienic meals, biometric entry, and power backup.',
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
                genderPreference: shared_types_1.GenderPreference.BOYS,
                furnishing: shared_types_1.FurnishingType.FULLY_FURNISHED,
                status: shared_types_1.PropertyStatus.ACTIVE,
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
                sharingType: shared_types_1.SharingType.SINGLE,
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
                sharingType: shared_types_1.SharingType.DOUBLE,
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
                permanentStatus: shared_types_1.BedStatus.AVAILABLE,
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
                    permanentStatus: shared_types_1.BedStatus.AVAILABLE,
                },
                {
                    propertyId: p1._id,
                    roomId: room102._id,
                    roomTypeId: p1Double._id,
                    bedLabel: 'Bed 102-B',
                    permanentStatus: shared_types_1.BedStatus.OCCUPIED,
                },
            ]);
            // 2. Property near IIT Delhi (approx 1.2km away)
            // IIT Delhi coords: [77.1926, 28.545]
            // Property 2: Hauz Khas [77.201, 28.548]
            const p2 = await this.propertyModel.create({
                ownerId: owner._id,
                name: 'Scholars Nest Girls Hostel',
                slug: 'scholars-nest-girls-hostel-hauz-khas',
                propertyType: shared_types_1.PropertyType.HOSTEL,
                description: 'Secure girls accommodation walking distance from IIT Delhi. Includes 24/7 biometric security, certified in-house mess, library study lounge, and daily housekeeping.',
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
                genderPreference: shared_types_1.GenderPreference.GIRLS,
                furnishing: shared_types_1.FurnishingType.FULLY_FURNISHED,
                status: shared_types_1.PropertyStatus.ACTIVE,
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
                sharingType: shared_types_1.SharingType.DOUBLE,
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
                    permanentStatus: shared_types_1.BedStatus.AVAILABLE,
                },
                {
                    propertyId: p2._id,
                    roomId: room201._id,
                    roomTypeId: p2Double._id,
                    bedLabel: 'Bed 201-Right',
                    permanentStatus: shared_types_1.BedStatus.AVAILABLE,
                },
            ]);
            this.logger.log('Successfully seeded 2 verified student accommodation records with rooms and beds.');
        }
        catch (err) {
            this.logger.warn(`Initial properties seeding skipped or deferred: ${err.message}`);
        }
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = PropertiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(1, (0, mongoose_1.InjectModel)(room_type_schema_1.RoomType.name)),
    __param(2, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __param(3, (0, mongoose_1.InjectModel)(bed_schema_1.Bed.name)),
    __param(4, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        inventory_service_1.InventoryService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map