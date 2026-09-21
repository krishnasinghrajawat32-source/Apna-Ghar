import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CollegesService } from './colleges.service';

@ApiTags('Colleges & Universities')
@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all colleges and universities with coordinates and slugs' })
  @ApiQuery({ name: 'city', required: false, example: 'New Delhi' })
  @ApiResponse({ status: 200, description: 'List of colleges' })
  async getAllColleges(@Query('city') city?: string) {
    return this.collegesService.getAllColleges(city);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Find college by slug' })
  @ApiResponse({ status: 200, description: 'College details' })
  @ApiResponse({ status: 404, description: 'College not found' })
  async getCollegeBySlug(@Param('slug') slug: string) {
    return this.collegesService.getCollegeBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Find college by UUID' })
  @ApiResponse({ status: 200, description: 'College details' })
  @ApiResponse({ status: 404, description: 'College not found' })
  async getCollegeById(@Param('id') id: string) {
    return this.collegesService.getCollegeById(id);
  }
}
