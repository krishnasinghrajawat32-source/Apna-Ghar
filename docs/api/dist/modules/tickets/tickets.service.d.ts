import { Model } from 'mongoose';
import { UserRole } from '@apna-ghar/shared-types';
import { TicketDocument } from './schemas/ticket.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
export declare class TicketsService {
    private readonly ticketModel;
    private readonly propertyModel;
    private readonly logger;
    constructor(ticketModel: Model<TicketDocument>, propertyModel: Model<PropertyDocument>);
    createTicket(studentId: string, dto: CreateTicketDto): Promise<TicketDocument>;
    getStudentTickets(studentId: string): Promise<TicketDocument[]>;
    getPropertyTickets(propertyId: string): Promise<TicketDocument[]>;
    getOwnerTickets(ownerId: string): Promise<TicketDocument[]>;
    updateTicketStatus(ticketId: string, role: UserRole, dto: UpdateTicketStatusDto): Promise<TicketDocument>;
}
//# sourceMappingURL=tickets.service.d.ts.map