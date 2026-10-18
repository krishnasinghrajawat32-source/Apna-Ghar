import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { HoldBedDto } from './dto/hold-bed.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Inventory, Room & Bed Selection')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get('properties/:propertyId')
  @ApiOperation({ summary: 'Get structured rooms and beds inventory with real-time bed hold statuses' })
  @ApiResponse({ status: 200, description: 'Hierarchical inventory layout and availability' })
  async getPropertyInventory(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    const data = await this.inventoryService.getDetailedAvailability(propertyId, currentUserId);
    return {
      success: true,
      data,
    };
  }

  @Post('beds/:bedId/hold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Temporarily hold an exact bed for 8 minutes via atomic Redis lock' })
  @ApiResponse({ status: 200, description: 'Bed hold acquired' })
  @ApiResponse({ status: 409, description: 'Bed is currently held by another student' })
  async holdBed(
    @Param('bedId') bedId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: HoldBedDto,
  ) {
    const hold = await this.inventoryService.holdBed(bedId, studentId, dto.ttlSeconds);
    return {
      success: true,
      data: hold,
    };
  }

  @Delete('beds/:bedId/hold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Release an active bed hold early' })
  @ApiResponse({ status: 200, description: 'Hold released successfully' })
  async releaseHold(
    @Param('bedId') bedId: string,
    @CurrentUser('id') studentId: string,
  ) {
    const result = await this.inventoryService.releaseHold(bedId, studentId);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Get('beds/:bedId/hold-status')
  @ApiOperation({ summary: 'Get current hold status and remaining TTL for a specific bed' })
  @ApiResponse({ status: 200, description: 'Bed hold status' })
  async getBedHoldStatus(
    @Param('bedId') bedId: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    const status = await this.inventoryService.getBedHoldStatus(bedId, currentUserId);
    return {
      success: true,
      data: status,
    };
  }

  @Get('user/active-hold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get active bed hold and bed details for the logged-in student' })
  @ApiResponse({ status: 200, description: 'Active student hold or null' })
  async getUserActiveHold(@CurrentUser('id') studentId: string) {
    const activeHold = await this.inventoryService.getUserActiveHold(studentId);
    return {
      success: true,
      data: activeHold,
    };
  }
}
