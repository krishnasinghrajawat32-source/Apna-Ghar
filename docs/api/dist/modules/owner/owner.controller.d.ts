import { OwnerService } from './owner.service';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import { UserRole } from '@apna-ghar/shared-types';
export declare class OwnerController {
    private readonly ownerService;
    constructor(ownerService: OwnerService);
    getOverview(ownerId: string): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").OwnerOverviewMetrics;
    }>;
    getProperties(ownerId: string): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").OwnerPropertySummary[];
    }>;
    getPropertyInventory(ownerId: string, propertyId: string): Promise<{
        success: boolean;
        data: {
            property: {
                id: string;
                name: string;
                slug: string;
                address: import("../properties/schemas/property.schema").PropertyAddress;
            };
            rooms: {
                id: string;
                roomNumber: string;
                floorNumber: number;
                status: "ACTIVE" | "MAINTENANCE";
                roomType: {
                    id: string;
                    name: string;
                    sharingType: import("@apna-ghar/shared-types").SharingType;
                    baseRent: number;
                } | null;
                beds: {
                    id: string;
                    bedLabel: string;
                    position: "WINDOW" | "CORNER" | "DOOR" | "STANDARD";
                    permanentStatus: import("@apna-ghar/shared-types").BedStatus;
                }[];
            }[];
        };
    }>;
    updateBedStatus(bedId: string, ownerId: string, role: UserRole, dto: UpdateBedStatusDto): Promise<{
        success: boolean;
        data: import("../inventory/schemas/bed.schema").BedDocument;
    }>;
}
//# sourceMappingURL=owner.controller.d.ts.map