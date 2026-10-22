import { Model } from 'mongoose';
import { OwnerOverviewMetrics, OwnerPropertySummary, BedStatus, UserRole } from '@apna-ghar/shared-types';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { RoomDocument } from '../inventory/schemas/room.schema';
import { BedDocument } from '../inventory/schemas/bed.schema';
import { RoomTypeDocument } from '../inventory/schemas/room-type.schema';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { VisitDocument } from '../visits/schemas/visit.schema';
import { TicketDocument } from '../tickets/schemas/ticket.schema';
export declare class OwnerService {
    private readonly propertyModel;
    private readonly roomModel;
    private readonly bedModel;
    private readonly roomTypeModel;
    private readonly bookingModel;
    private readonly visitModel;
    private readonly ticketModel;
    private readonly logger;
    constructor(propertyModel: Model<PropertyDocument>, roomModel: Model<RoomDocument>, bedModel: Model<BedDocument>, roomTypeModel: Model<RoomTypeDocument>, bookingModel: Model<BookingDocument>, visitModel: Model<VisitDocument>, ticketModel: Model<TicketDocument>);
    /**
     * Calculates aggregated portfolio performance metrics for an owner.
     */
    getOverview(ownerId: string): Promise<OwnerOverviewMetrics>;
    /**
     * Retrieves summary list of all properties owned by owner with bed counts.
     */
    getProperties(ownerId: string): Promise<OwnerPropertySummary[]>;
    /**
     * Retrieves deep room and bed inventory for a specific property.
     */
    getPropertyInventory(ownerId: string, propertyId: string): Promise<{
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
                permanentStatus: BedStatus;
            }[];
        }[];
    }>;
    /**
     * Updates a bed's permanent operational status between AVAILABLE and MAINTENANCE.
     */
    updateBedStatus(bedId: string, ownerId: string, role: UserRole, newStatus: 'AVAILABLE' | 'MAINTENANCE'): Promise<BedDocument>;
}
//# sourceMappingURL=owner.service.d.ts.map