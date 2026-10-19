import {
  Controller,
  Post,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Reviews & Ratings')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a verified resident review for a confirmed stay' })
  @ApiResponse({ status: 201, description: 'Review successfully created' })
  async createReview(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewsService.createReview(studentId, dto);
    return {
      success: true,
      data: review,
    };
  }

  @Public()
  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get approved reviews and rating breakdown for a property' })
  @ApiResponse({ status: 200, description: 'Property reviews and ratings breakdown' })
  async getPropertyReviews(@Param('propertyId') propertyId: string) {
    const result = await this.reviewsService.getPropertyReviews(propertyId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all reviews across platform for admin management' })
  @ApiResponse({ status: 200, description: 'List of platform reviews' })
  async getAllReviews() {
    const reviews = await this.reviewsService.getAllReviews();
    return {
      success: true,
      data: reviews,
    };
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending reviews requiring moderation' })
  @ApiResponse({ status: 200, description: 'List of pending reviews' })
  async getPendingReviews() {
    const reviews = await this.reviewsService.getPendingReviews();
    return {
      success: true,
      data: reviews,
    };
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Moderate (approve/reject) a student review' })
  @ApiResponse({ status: 200, description: 'Review moderation updated' })
  async moderateReview(
    @Param('id') reviewId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    const review = await this.reviewsService.moderateReview(reviewId, dto);
    return {
      success: true,
      data: review,
    };
  }
}
