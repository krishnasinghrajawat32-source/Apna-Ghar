import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReportReviewDto, QueryReviewsDto } from './reviews.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@apnaghar/shared-types';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a verified stay review for a completed booking' })
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @Post(':id/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a fraudulent or inappropriate review' })
  @HttpCode(HttpStatus.CREATED)
  async reportReview(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() dto: ReportReviewDto,
  ) {
    return this.reviewsService.reportReview(userId, reviewId, dto);
  }

  @Patch('admin/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin moderation: approve review' })
  async adminApproveReview(@Param('id', ParseUUIDPipe) reviewId: string) {
    return this.reviewsService.adminApproveReview(reviewId);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin moderation: delete review and recalculate property ratings' })
  async adminDeleteReview(@Param('id', ParseUUIDPipe) reviewId: string) {
    return this.reviewsService.adminDeleteReview(reviewId);
  }
}

@ApiTags('Properties')
@Controller('properties')
export class PropertyReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/reviews')
  @Public()
  @ApiOperation({ summary: 'Get public reviews and rating summary breakdown for a property' })
  async getPropertyReviews(
    @Param('id', ParseUUIDPipe) propertyId: string,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getPropertyReviews(propertyId, query.page, query.limit);
  }
}
