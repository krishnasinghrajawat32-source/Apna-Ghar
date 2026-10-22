import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OwnerService } from './owner.service';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';
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
