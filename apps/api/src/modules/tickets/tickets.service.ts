import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '@apna-ghar/shared-types';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async createTicket(studentId: string, dto: CreateTicketDto): Promise<TicketDocument> {
    if (!Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }

    const property = await this.propertyModel.findById(dto.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    const ticket = await this.ticketModel.create({
      studentId: new Types.ObjectId(studentId),
      propertyId: new Types.ObjectId(dto.propertyId),
      bookingId: dto.bookingId && Types.ObjectId.isValid(dto.bookingId) ? new Types.ObjectId(dto.bookingId) : null,
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

  async getStudentTickets(studentId: string): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('propertyId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPropertyTickets(propertyId: string): Promise<TicketDocument[]> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }

    return this.ticketModel
      .find({ propertyId: new Types.ObjectId(propertyId) })
      .populate('studentId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOwnerTickets(ownerId: string): Promise<TicketDocument[]> {
    const properties = await this.propertyModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
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

  async updateTicketStatus(
    ticketId: string,
    role: UserRole,
    dto: UpdateTicketStatusDto,
  ): Promise<TicketDocument> {
    if (!Types.ObjectId.isValid(ticketId)) {
      throw new BadRequestException('Invalid ticket ID format.');
    }

    if (role === UserRole.STUDENT && dto.status !== 'CLOSED') {
      throw new ForbiddenException('Students can only close their own resolved tickets.');
    }

    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
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
}
