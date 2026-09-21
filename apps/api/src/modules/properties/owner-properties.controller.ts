import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Owner Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Controller('owner/properties')
export class OwnerPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new property listing (Owner Only)' })
  @ApiResponse({ status: 201, description: 'Property created as draft' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-owners' })
  async createProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.createProperty(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties owned by current user with occupancy rates' })
  @ApiResponse({ status: 200, description: 'List of owned properties' })
  async getMyProperties(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.getOwnerProperties(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property listing details' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  @ApiResponse({ status: 403, description: 'Not authorized for this property' })
  async updateProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') propertyId: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateProperty(user.id, propertyId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete / deactivate property listing' })
  @ApiResponse({ status: 200, description: 'Property deactivated' })
  @ApiResponse({ status: 403, description: 'Not authorized for this property' })
  async deleteProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') propertyId: string,
  ) {
    return this.propertiesService.deleteProperty(user.id, propertyId);
  }
}
