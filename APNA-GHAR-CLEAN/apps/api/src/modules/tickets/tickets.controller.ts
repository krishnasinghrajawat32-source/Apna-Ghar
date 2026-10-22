import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Maintenance & Support Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new maintenance or complaint ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateTicketDto,
  ) {
    const ticket = await this.ticketsService.createTicket(studentId, dto);
    return {
      success: true,
      data: ticket,
    };
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all maintenance tickets submitted by the authenticated student' })
  @ApiResponse({ status: 200, description: 'List of student tickets' })
  async getStudentTickets(@CurrentUser('id') studentId: string) {
    const tickets = await this.ticketsService.getStudentTickets(studentId);
    return {
      success: true,
      data: tickets,
    };
  }

  @Get('property/:propertyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all maintenance tickets for a property' })
  @ApiResponse({ status: 200, description: 'List of property tickets' })
  async getPropertyTickets(@Param('propertyId') propertyId: string) {
    const tickets = await this.ticketsService.getPropertyTickets(propertyId);
    return {
      success: true,
      data: tickets,
    };
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all maintenance tickets across all properties owned by authenticated owner' })
  @ApiResponse({ status: 200, description: 'List of owner tickets' })
  async getOwnerTickets(@CurrentUser('id') ownerId: string) {
    const tickets = await this.ticketsService.getOwnerTickets(ownerId);
    return {
      success: true,
      data: tickets,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update ticket resolution status' })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    const ticket = await this.ticketsService.updateTicketStatus(ticketId, role, dto);
    return {
      success: true,
      data: ticket,
    };
  }
}
