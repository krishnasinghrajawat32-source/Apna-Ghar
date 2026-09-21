import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PropertiesService } from './properties.service';
import { PropertyQueryDto } from './dto/property-query.dto';

@ApiTags('Properties (Public)')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse verified student properties with filters and live bed availability' })
  @ApiResponse({ status: 200, description: 'Paginated properties list' })
  async getProperties(@Query() query: PropertyQueryDto) {
    return this.propertiesService.getPublicProperties(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get full property details including room types, rooms, and atomic beds' })
  @ApiResponse({ status: 200, description: 'Detailed property view' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async getPropertyById(@Param('id') id: string) {
    return this.propertiesService.getPropertyById(id);
  }
}
