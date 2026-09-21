import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto } from './bookings.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student creates a booking request (Status: REQUESTED)' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  async createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBookingRequest(user.id, dto);
  }

  @Get('bookings/student')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get current student booking history' })
  @ApiResponse({ status: 200, description: 'List of student bookings' })
  async getStudentBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.getStudentBookings(user.id);
  }

  @Post('bookings/:id/hold')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acquire atomic 15-minute bed hold (Status: PAYMENT_PENDING)' })
  @ApiResponse({ status: 200, description: 'Bed hold acquired' })
  @ApiResponse({ status: 409, description: 'Bed is currently held or unavailable' })
  async acquireBedHold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.acquireBedHold(user.id, id);
  }

  @Post('bookings/:id/confirm')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm booking after successful payment (Status: CONFIRMED)' })
  @ApiResponse({ status: 200, description: 'Booking confirmed and bed reserved' })
  async confirmBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.confirmBooking(user.id, id);
  }

  @Post('bookings/:id/check-in')
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-in to the booked property (Status: CHECKED_IN)' })
  @ApiResponse({ status: 200, description: 'Check-in completed and bed marked occupied' })
  async checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.checkIn(user.id, id);
  }

  @Post('bookings/:id/complete')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete stay and release bed back to inventory (Status: COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Stay completed' })
  async completeBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.completeBooking(user.id, id);
  }

  @Post('bookings/:id/cancel')
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking and release held bed (Status: CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(user.id, user.role, id, dto);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get booking details by ID with state history audit log' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async getBookingById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.getBookingById(user.id, id);
  }

  @Get('owner/bookings')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Owner lists all bookings for their properties' })
  @ApiResponse({ status: 200, description: 'List of owner bookings' })
  async getOwnerBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.getOwnerBookings(user.id);
  }

  @Patch('owner/bookings/:id/approve')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Owner approves a booking request (Status: OWNER_APPROVED)' })
  @ApiResponse({ status: 200, description: 'Booking approved' })
  async approveBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingsService.approveBooking(user.id, id);
  }
}
