import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { PropertiesService } from '../properties/properties.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Pricing & Living Cost')
@Controller('properties')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly propertiesService: PropertiesService,
  ) {}

  @Public()

  @Get(':id/cost-breakdown')
  @ApiOperation({ summary: 'Get transparent Total Living Cost breakdown by property ID' })
  @ApiQuery({ name: 'roomTypeId', required: false, description: 'Specific room type ID' })
  @ApiResponse({ status: 200, description: 'Total Living Cost line items and upfront totals' })
  async getCostBreakdown(
    @Param('id') propertyId: string,
    @Query('roomTypeId') roomTypeId?: string,
  ) {
    const cost = await this.pricingService.getCostBreakdown(propertyId, roomTypeId);
    return {
      success: true,
      data: cost,
    };
  }

  @Public()
  @Get('slug/:slug/cost-breakdown')
  @ApiOperation({ summary: 'Get transparent Total Living Cost breakdown by property slug' })
  @ApiQuery({ name: 'roomTypeId', required: false, description: 'Specific room type ID' })
  @ApiResponse({ status: 200, description: 'Total Living Cost line items and upfront totals' })
  async getCostBreakdownBySlug(
    @Param('slug') slug: string,
    @Query('roomTypeId') roomTypeId?: string,
  ) {
    const { property } = await this.propertiesService.findBySlug(slug);
    const prop = property as unknown as { id?: string; _id?: { toString(): string } };
    const propId = prop.id || prop._id?.toString() || '';
    const cost = await this.pricingService.getCostBreakdown(propId, roomTypeId);
    return {
      success: true,
      data: cost,
    };
  }
}
