import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Search & Marketplace')
@Public()
@Controller('properties')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search properties near university using $geoNear proximity and multifaceted filters' })
  @SwaggerResponse({ status: 200, description: 'Paginated search results with distance in meters' })
  async search(@Query() dto: SearchPropertiesDto) {
    const result = await this.searchService.search(dto);
    return {
      data: result.data,
      meta: {
        ...result.meta,
        collegeAnchor: result.collegeAnchor,
      },
    };
  }
}
