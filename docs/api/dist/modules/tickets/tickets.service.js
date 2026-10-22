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
var TicketsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
const ticket_schema_1 = require("./schemas/ticket.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
let TicketsService = TicketsService_1 = class TicketsService {
    ticketModel;
    propertyModel;
    logger = new common_1.Logger(TicketsService_1.name);
    constructor(ticketModel, propertyModel) {
        this.ticketModel = ticketModel;
        this.propertyModel = propertyModel;
    }
    async createTicket(studentId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.propertyId)) {
            throw new common_1.BadRequestException('Invalid property ID format.');
        }
        const property = await this.propertyModel.findById(dto.propertyId);
        if (!property) {
            throw new common_1.NotFoundException('Property not found.');
        }
        const ticket = await this.ticketModel.create({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            propertyId: new mongoose_2.Types.ObjectId(dto.propertyId),
            bookingId: dto.bookingId && mongoose_2.Types.ObjectId.isValid(dto.bookingId) ? new mongoose_2.Types.ObjectId(dto.bookingId) : null,
            category: dto.category,
            title: dto.title,
            description: dto.description,
            priority: dto.priority || 'MEDIUM',
            status: 'OPEN',
        });
        this.logger.log(`Maintenance ticket created: ${ticket._id} by student ${studentId} for property ${dto.propertyId}`);
        const populated = await this.ticketModel
            .findById(ticket._id)
            .populate('propertyId')
            .exec();
        return populated || ticket;
    }
    async getStudentTickets(studentId) {
        return this.ticketModel
            .find({ studentId: new mongoose_2.Types.ObjectId(studentId) })
            .populate('propertyId')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getPropertyTickets(propertyId) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.BadRequestException('Invalid property ID format.');
        }
        return this.ticketModel
            .find({ propertyId: new mongoose_2.Types.ObjectId(propertyId) })
            .populate('studentId', 'name email phone')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getOwnerTickets(ownerId) {
        const properties = await this.propertyModel
            .find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) })
            .select('_id')
            .exec();
        const propertyIds = properties.map((p) => p._id);
        return this.ticketModel
            .find({ propertyId: { $in: propertyIds } })
            .populate('propertyId')
            .populate('studentId', 'name email phone')
            .sort({ createdAt: -1 })
            .exec();
    }
    async updateTicketStatus(ticketId, role, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(ticketId)) {
            throw new common_1.BadRequestException('Invalid ticket ID format.');
        }
        if (role === shared_types_1.UserRole.STUDENT && dto.status !== 'CLOSED') {
            throw new common_1.ForbiddenException('Students can only close their own resolved tickets.');
        }
        const ticket = await this.ticketModel.findById(ticketId);
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found.');
        }
        ticket.status = dto.status;
        if (dto.resolutionNotes) {
            ticket.resolutionNotes = dto.resolutionNotes;
        }
        if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
            ticket.resolvedAt = new Date();
        }
        await ticket.save();
        return ticket;
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = TicketsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ticket_schema_1.Ticket.name)),
    __param(1, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map