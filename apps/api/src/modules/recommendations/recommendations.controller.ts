import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { GetRecommendationsDto } from './recommendations.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get explainable, multi-factor scored property recommendations',
    description:
      'Calculates algorithmic match scores based on campus proximity, budget alignment, verified status, social ratings, and amenity preferences, with human-readable explainability reasons.',
  })
  async getRecommendations(@Query() query: GetRecommendationsDto) {
    return this.recommendationsService.getRecommendations(query);
  }
}
