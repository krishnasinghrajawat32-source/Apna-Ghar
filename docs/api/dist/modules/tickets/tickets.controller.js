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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tickets_service_1 = require("./tickets.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const update_ticket_status_dto_1 = require("./dto/update-ticket-status.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let TicketsController = class TicketsController {
    ticketsService;
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    async createTicket(studentId, dto) {
        const ticket = await this.ticketsService.createTicket(studentId, dto);
        return {
            success: true,
            data: ticket,
        };
    }
    async getStudentTickets(studentId) {
        const tickets = await this.ticketsService.getStudentTickets(studentId);
        return {
            success: true,
            data: tickets,
        };
    }
    async getPropertyTickets(propertyId) {
        const tickets = await this.ticketsService.getPropertyTickets(propertyId);
        return {
            success: true,
            data: tickets,
        };
    }
    async getOwnerTickets(ownerId) {
        const tickets = await this.ticketsService.getOwnerTickets(ownerId);
        return {
            success: true,
            data: tickets,
        };
    }
    async updateTicketStatus(ticketId, role, dto) {
        const ticket = await this.ticketsService.updateTicketStatus(ticketId, role, dto);
        return {
            success: true,
            data: ticket,
        };
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new maintenance or complaint ticket' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Ticket created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_ticket_dto_1.CreateTicketDto]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)('student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all maintenance tickets submitted by the authenticated student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of student tickets' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getStudentTickets", null);
__decorate([
    (0, common_1.Get)('property/:propertyId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all maintenance tickets for a property' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of property tickets' }),
    __param(0, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getPropertyTickets", null);
__decorate([
    (0, common_1.Get)('owner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all maintenance tickets across all properties owned by authenticated owner' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of owner tickets' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getOwnerTickets", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update ticket resolution status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ticket status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_ticket_status_dto_1.UpdateTicketStatusDto]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "updateTicketStatus", null);
exports.TicketsController = TicketsController = __decorate([
    (0, swagger_1.ApiTags)('Maintenance & Support Tickets'),
    (0, common_1.Controller)('tickets'),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map