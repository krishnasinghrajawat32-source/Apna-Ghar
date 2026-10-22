import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UserRole } from '@apna-ghar/shared-types';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    createTicket(studentId: string, dto: CreateTicketDto): Promise<{
        success: boolean;
        data: import("./schemas/ticket.schema").TicketDocument;
    }>;
    getStudentTickets(studentId: string): Promise<{
        success: boolean;
        data: import("./schemas/ticket.schema").TicketDocument[];
    }>;
    getPropertyTickets(propertyId: string): Promise<{
        success: boolean;
        data: import("./schemas/ticket.schema").TicketDocument[];
    }>;
    getOwnerTickets(ownerId: string): Promise<{
        success: boolean;
        data: import("./schemas/ticket.schema").TicketDocument[];
    }>;
    updateTicketStatus(ticketId: string, role: UserRole, dto: UpdateTicketStatusDto): Promise<{
        success: boolean;
        data: import("./schemas/ticket.schema").TicketDocument;
    }>;
}
//# sourceMappingURL=tickets.controller.d.ts.map