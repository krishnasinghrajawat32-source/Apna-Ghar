import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Bookings & Checkout')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Get('preview-charges')
  @ApiOperation({ summary: 'Calculate itemized rent and deposit charges preview for a bed' })
  @ApiQuery({ name: 'bedId', required: true })
  @ApiResponse({ status: 200, description: 'Charges breakdown' })
  async previewCharges(@Query('bedId') bedId: string) {
    const breakdown = await this.bookingsService.calculateChargesPreview(bedId);
    return {
      success: true,
      data: breakdown,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a pre-payment booking from an active temporary bed hold' })
  @ApiResponse({ status: 201, description: 'Booking created with unique human-readable reference' })
  @ApiResponse({ status: 400, description: 'No active bed hold or invalid move-in date' })
  async createBooking(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateBookingDto,
  ) {
    const booking = await this.bookingsService.createBooking(studentId, dto);
    return {
      success: true,
      data: booking,
    };
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings for the authenticated student' })
  @ApiResponse({ status: 200, description: 'List of student bookings' })
  async getStudentBookings(@CurrentUser('id') studentId: string) {
    const bookings = await this.bookingsService.getStudentBookings(studentId);
    return {
      success: true,
      data: bookings,
    };
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings across properties owned by authenticated owner' })
  @ApiResponse({ status: 200, description: 'List of owner bookings' })
  async getOwnerBookings(@CurrentUser('id') ownerId: string) {
    const bookings = await this.bookingsService.getOwnerBookings(ownerId);
    return {
      success: true,
      data: bookings,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get single booking by ID with ownership check' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async getBookingById(
    @Param('id') bookingId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const booking = await this.bookingsService.getBookingById(bookingId, userId, role);
    return {
      success: true,
      data: booking,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update booking status (cancel by student, or manage by owner/admin)' })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  async updateBookingStatus(
    @Param('id') bookingId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.bookingsService.updateBookingStatus(bookingId, userId, role, dto);
    return {
      success: true,
      data: booking,
    };
  }
}
