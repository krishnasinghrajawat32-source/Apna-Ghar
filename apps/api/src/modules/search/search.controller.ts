import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SearchService } from './search.service';
import { NearbySearchDto } from './dto/nearby-search.dto';

@ApiTags('Search (Campus & Distance)')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('nearby')
  @ApiOperation({
    summary: 'Search properties within a specified kilometer radius of a college campus or GPS coordinates',
  })
  @ApiResponse({ status: 200, description: 'List of properties within radius, sorted by distance' })
  async searchNearby(@Query() query: NearbySearchDto) {
    return this.searchService.searchNearby(query);
  }
}
