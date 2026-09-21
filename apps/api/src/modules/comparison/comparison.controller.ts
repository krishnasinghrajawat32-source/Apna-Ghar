import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ComparisonService } from './comparison.service';
import { ComparePropertiesDto } from './dto/compare-properties.dto';

@ApiTags('Property Comparison')
@Controller('comparison')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  @Public()
  @Post('matrix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate comparative matrix for 2 to 4 student properties' })
  @ApiResponse({ status: 200, description: 'Comparison matrix generated' })
  @ApiResponse({ status: 400, description: 'Invalid number of properties (requires 2-4)' })
  async compareProperties(@Body() dto: ComparePropertiesDto) {
    return this.comparisonService.generateComparisonMatrix(dto);
  }
}
