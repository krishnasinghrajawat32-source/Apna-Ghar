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
import { OwnerService } from './owner.service';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateBedDto } from './dto/create-bed.dto';
import { BookingDecisionDto } from './dto/booking-decision.dto';
import { UpdateOwnerProfileDto } from './dto/update-owner-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Owner Operations & Property Management')
@Controller('owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get owner business profile and KYC details' })
  @ApiResponse({ status: 200, description: 'Owner profile details' })
  async getProfile(@CurrentUser('id') ownerId: string) {
    const profile = await this.ownerService.getProfile(ownerId);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update owner business profile details' })
  @ApiResponse({ status: 200, description: 'Updated owner profile' })
  async updateProfile(
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateOwnerProfileDto,
  ) {
    const profile = await this.ownerService.updateProfile(ownerId, dto);
    return {
      success: true,
      data: profile,
    };
  }

  @Post('properties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new property listing with address, coordinates, and optional room types' })
  @ApiResponse({ status: 201, description: 'Property created (pending verification)' })
  async createProperty(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreatePropertyDto,
  ) {
    const property = await this.ownerService.createProperty(ownerId, dto);
    return {
      success: true,
      data: property,
    };
  }

  @Patch('properties/:propertyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update details of an owned property' })
  @ApiResponse({ status: 200, description: 'Updated property' })
  async updateProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdatePropertyDto,
  ) {
    const property = await this.ownerService.updateProperty(ownerId, propertyId, role, dto);
    return {
      success: true,
      data: property,
    };
  }

  @Post('properties/:propertyId/rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new physical room to a property' })
  @ApiResponse({ status: 201, description: 'Room created' })
  async createRoom(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: CreateRoomDto,
  ) {
    const room = await this.ownerService.createRoom(ownerId, propertyId, role, dto);
    return {
      success: true,
      data: room,
    };
  }

  @Post('rooms/:roomId/beds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an individual bed inventory item to a room' })
  @ApiResponse({ status: 201, description: 'Bed created' })
  async createBed(
    @Param('roomId') roomId: string,
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: CreateBedDto,
  ) {
    const bed = await this.ownerService.createBed(ownerId, roomId, role, dto);
    return {
      success: true,
      data: bed,
    };
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all booking requests and history for properties owned by this owner' })
  @ApiResponse({ status: 200, description: 'List of owner property booking requests' })
  async getBookings(@CurrentUser('id') ownerId: string) {
    const bookings = await this.ownerService.getOwnerBookings(ownerId);
    return {
      success: true,
      data: bookings,
    };
  }

  @Patch('bookings/:id/decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept or reject student booking request with collision prevention' })
  @ApiResponse({ status: 200, description: 'Booking decision recorded (not a paid transaction)' })
  async decideBooking(
    @Param('id') bookingId: string,
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: BookingDecisionDto,
  ) {
    const booking = await this.ownerService.decideBooking(ownerId, bookingId, role, dto);
    return {
      success: true,
      data: booking,
    };
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated portfolio metrics for authenticated owner' })
  @ApiResponse({ status: 200, description: 'Aggregated owner overview metrics' })
  async getOverview(@CurrentUser('id') ownerId: string) {
    const metrics = await this.ownerService.getOverview(ownerId);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('properties')
  @ApiOperation({ summary: 'List all properties owned by authenticated owner with inventory counts' })
  @ApiResponse({ status: 200, description: 'List of owner properties' })
  async getProperties(@CurrentUser('id') ownerId: string) {
    const properties = await this.ownerService.getProperties(ownerId);
    return {
      success: true,
      data: properties,
    };
  }

  @Get('properties/:propertyId/inventory')
  @ApiOperation({ summary: 'Get physical rooms and beds breakdown for an owner property' })
  @ApiResponse({ status: 200, description: 'Hierarchical room and bed inventory' })
  async getPropertyInventory(
    @CurrentUser('id') ownerId: string,
    @Param('propertyId') propertyId: string,
  ) {
    const inventory = await this.ownerService.getPropertyInventory(ownerId, propertyId);
    return {
      success: true,
      data: inventory,
    };
  }

  @Patch('beds/:bedId/status')
  @ApiOperation({ summary: 'Update bed operational status between AVAILABLE and MAINTENANCE' })
  @ApiResponse({ status: 200, description: 'Bed status updated' })
  async updateBedStatus(
    @Param('bedId') bedId: string,
    @CurrentUser('id') ownerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateBedStatusDto,
  ) {
    const bed = await this.ownerService.updateBedStatus(bedId, ownerId, role, dto.permanentStatus);
    return {
      success: true,
      data: bed,
    };
  }
}
