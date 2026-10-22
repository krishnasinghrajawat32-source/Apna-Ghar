import { InventoryService } from './inventory.service';
import { HoldBedDto } from './dto/hold-bed.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getPropertyInventory(propertyId: string, currentUserId?: string): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").PropertyInventoryResponse;
    }>;
    holdBed(bedId: string, studentId: string, dto: HoldBedDto): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").HoldResponse;
    }>;
    releaseHold(bedId: string, studentId: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
        };
    }>;
    getBedHoldStatus(bedId: string, currentUserId?: string): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").BedHoldStatus;
    }>;
    getUserActiveHold(studentId: string): Promise<{
        success: boolean;
        data: {
            bed: import("mongoose").FlattenMaps<import("./schemas/bed.schema").BedDocument> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            };
            hold: import("@apna-ghar/shared-types").BedHoldStatus;
        } | null;
    }>;
}
//# sourceMappingURL=inventory.controller.d.ts.map