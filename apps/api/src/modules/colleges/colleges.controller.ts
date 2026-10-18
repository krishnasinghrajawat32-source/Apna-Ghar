import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { CollegesService } from './colleges.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Colleges')
@Public()
@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Autocomplete search for colleges by name or city' })
  @SwaggerResponse({ status: 200, description: 'Matched universities with GeoJSON location' })
  async search(@Query('q') query?: string, @Query('limit') limit?: number) {
    const results = await this.collegesService.search(query || '', limit ? Number(limit) : 10);
    return results.map((c) => c.toJSON());
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get college profile and coordinates by slug' })
  @SwaggerResponse({ status: 200, description: 'College profile' })
  async findBySlug(@Param('slug') slug: string) {
    const college = await this.collegesService.findBySlug(slug);
    return college.toJSON();
  }
}
