import { Model } from 'mongoose';
import { VisitDocument } from './schemas/visit.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { UserRole } from '@apna-ghar/shared-types';
export declare const STANDARD_VISIT_SLOTS: string[];
export declare class VisitsService {
    private readonly visitModel;
    private readonly propertyModel;
    private readonly logger;
    constructor(visitModel: Model<VisitDocument>, propertyModel: Model<PropertyDocument>);
    /**
     * Schedule a new visit request by student
     */
    createVisit(studentId: string, dto: CreateVisitDto): Promise<VisitDocument>;
    /**
     * Get all visits for the currently authenticated student
     */
    getStudentVisits(studentId: string): Promise<unknown[]>;
    /**
     * Get all incoming visits for an owner
     */
    getOwnerVisits(ownerId: string): Promise<unknown[]>;
    /**
     * Get visit by ID with authorization check
     */
    getVisitById(visitId: string, userId: string, role: UserRole): Promise<VisitDocument>;
    /**
     * Update visit status (student cancel, or owner confirm/reject/complete)
     */
    updateVisitStatus(visitId: string, userId: string, role: UserRole, dto: UpdateVisitStatusDto): Promise<VisitDocument>;
    /**
     * Get available slots for a property on a specific date
     */
    getAvailableSlots(propertyId: string, dateString: string): Promise<{
        date: string;
        slots: {
            slot: string;
            available: boolean;
        }[];
    }>;
}
//# sourceMappingURL=visits.service.d.ts.map