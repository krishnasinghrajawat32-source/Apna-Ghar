import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { UserRole } from '@apna-ghar/shared-types';
export declare class VisitsController {
    private readonly visitsService;
    constructor(visitsService: VisitsService);
    getAvailableSlots(propertyId: string, date: string): Promise<{
        success: boolean;
        data: {
            date: string;
            slots: {
                slot: string;
                available: boolean;
            }[];
        };
    }>;
    createVisit(studentId: string, dto: CreateVisitDto): Promise<{
        success: boolean;
        data: import("./schemas/visit.schema").VisitDocument;
    }>;
    getStudentVisits(studentId: string): Promise<{
        success: boolean;
        data: unknown[];
    }>;
    getOwnerVisits(ownerId: string): Promise<{
        success: boolean;
        data: unknown[];
    }>;
    getVisitById(visitId: string, userId: string, role: UserRole): Promise<{
        success: boolean;
        data: import("./schemas/visit.schema").VisitDocument;
    }>;
    updateStatus(visitId: string, userId: string, role: UserRole, dto: UpdateVisitStatusDto): Promise<{
        success: boolean;
        data: import("./schemas/visit.schema").VisitDocument;
    }>;
}
//# sourceMappingURL=visits.controller.d.ts.map