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
import { InventoryService } from './inventory.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateBedStatusDto } from './dto/update-bed.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Inventory (Rooms & Beds)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Controller('owner/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('properties/:propertyId/room-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new Room Type blueprint to a property' })
  @ApiResponse({ status: 201, description: 'Room type blueprint created' })
  async createRoomType(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.inventoryService.createRoomType(user.id, propertyId, dto);
  }

  @Post('properties/:propertyId/room-types/:roomTypeId/rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Instantiate a physical Room with atomic Beds' })
  @ApiResponse({ status: 201, description: 'Room and beds instantiated' })
  async createRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.inventoryService.createRoom(user.id, propertyId, roomTypeId, dto);
  }

  @Patch('beds/:bedId/status')
  @ApiOperation({ summary: 'Override bed status (AVAILABLE, MAINTENANCE, INACTIVE)' })
  @ApiResponse({ status: 200, description: 'Bed status updated' })
  async updateBedStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bedId') bedId: string,
    @Body() dto: UpdateBedStatusDto,
  ) {
    return this.inventoryService.updateBedStatus(user.id, bedId, dto.status);
  }

  @Get('properties/:propertyId')
  @ApiOperation({ summary: 'Get complete Room -> Bed inventory hierarchy and status counts' })
  @ApiResponse({ status: 200, description: 'Inventory hierarchy tree' })
  async getInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.inventoryService.getInventoryHierarchy(propertyId);
  }
}
