import { OnModuleInit } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { PropertyDocument } from './schemas/property.schema';
import { InventoryService } from '../inventory/inventory.service';
import { RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { RoomDocument } from '../inventory/schemas/room.schema';
import { BedDocument } from '../inventory/schemas/bed.schema';
import { UserDocument } from '../users/schemas/user.schema';
export declare class PropertiesService implements OnModuleInit {
    private readonly propertyModel;
    private readonly roomTypeModel;
    private readonly roomModel;
    private readonly bedModel;
    private readonly userModel;
    private readonly inventoryService;
    private readonly logger;
    constructor(propertyModel: Model<PropertyDocument>, roomTypeModel: Model<RoomTypeDocument>, roomModel: Model<RoomDocument>, bedModel: Model<BedDocument>, userModel: Model<UserDocument>, inventoryService: InventoryService);
    onModuleInit(): Promise<void>;
    findBySlug(slug: string): Promise<{
        property: import("mongoose").FlattenMaps<PropertyDocument> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
        roomTypes: (import("mongoose").FlattenMaps<any> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        availableBedCount: number;
    }>;
    findById(id: string | Types.ObjectId): Promise<PropertyDocument>;
    getRooms(propertyId: string | Types.ObjectId): Promise<{
        roomTypes: (import("mongoose").FlattenMaps<any> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        rooms: (import("mongoose").FlattenMaps<any> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
    getAvailability(propertyId: string | Types.ObjectId): Promise<import("@apna-ghar/shared-types").PropertyInventoryResponse>;
    private seedInitialProperties;
}
//# sourceMappingURL=properties.service.d.ts.map