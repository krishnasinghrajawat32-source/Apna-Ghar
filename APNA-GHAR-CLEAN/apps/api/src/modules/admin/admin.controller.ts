import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@apna-ghar/shared-types';
import { AdminService } from './admin.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Platform Administration')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform-wide operational KPIs and aggregate stats' })
  @ApiResponse({ status: 200, description: 'Platform overview statistics' })
  async getOverview() {
    const stats = await this.adminService.getOverview();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('trust-audits')
  @ApiOperation({ summary: 'Get 7-point Trust Passport audit status for all properties' })
  @ApiResponse({ status: 200, description: 'List of properties with audit status' })
  async getTrustAudits() {
    const audits = await this.adminService.getTrustAudits();
    return {
      success: true,
      data: audits,
    };
  }

  @Patch('trust-audits/:propertyId/checkpoint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Audit (verify/reject) a specific Trust Passport checkpoint' })
  @ApiResponse({ status: 200, description: 'Updated Trust Passport' })
  async verifyTrustCheckpoint(
    @Param('propertyId') propertyId: string,
    @Body() dto: VerifyCheckpointDto,
    @CurrentUser('id') auditorId: string,
  ) {
    const updated = await this.adminService.verifyTrustCheckpoint(
      propertyId,
      dto,
      auditorId,
    );
    return {
      success: true,
      data: updated,
    };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews across platform for admin moderation' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getAllReviews() {
    const reviews = await this.adminService.getAllReviews();
    return {
      success: true,
      data: reviews,
    };
  }

  @Patch('reviews/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a student review' })
  @ApiResponse({ status: 200, description: 'Updated review status' })
  async moderateReview(
    @Param('id') reviewId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    const review = await this.adminService.moderateReview(reviewId, dto);
    return {
      success: true,
      data: review,
    };
  }
}
