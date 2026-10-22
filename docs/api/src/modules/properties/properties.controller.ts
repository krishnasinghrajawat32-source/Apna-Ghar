import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Properties')
@Public()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get property details, room types, and available bed count by slug' })
  @SwaggerResponse({ status: 200, description: 'Property detail response' })
  async findBySlug(@Param('slug') slug: string) {
    return this.propertiesService.findBySlug(slug);
  }

  @Get(':id/rooms')
  @ApiOperation({ summary: 'Get room types and physical rooms for a property' })
  @SwaggerResponse({ status: 200, description: 'List of rooms and room types' })
  async getRooms(@Param('id') id: string) {
    return this.propertiesService.getRooms(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get live bed availability breakdown for a property' })
  @SwaggerResponse({ status: 200, description: 'Live bed availability hierarchy' })
  async getAvailability(@Param('id') id: string) {
    return this.propertiesService.getAvailability(id);
  }
}
