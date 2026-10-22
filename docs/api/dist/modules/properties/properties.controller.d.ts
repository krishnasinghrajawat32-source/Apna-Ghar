import { PropertiesService } from './properties.service';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    findBySlug(slug: string): Promise<{
        property: import("mongoose").FlattenMaps<import("./schemas/property.schema").PropertyDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    getRooms(id: string): Promise<{
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
    getAvailability(id: string): Promise<import("@apna-ghar/shared-types").PropertyInventoryResponse>;
}
//# sourceMappingURL=properties.controller.d.ts.map