import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserRole, PropertyStatus, ApprovalStatus, MediaReviewStatus } from '@apna-ghar/shared-types';
import { AdminService } from './admin.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
import { ModerateEntityDto, ModerateUserDto } from './dto/moderate-entity.dto';
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

  @Get('users')
  @ApiOperation({ summary: 'List user accounts across the platform' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(@Query('role') role?: UserRole) {
    const users = await this.adminService.getAllUsers(role);
    return {
      success: true,
      data: users,
    };
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, suspend, or update status of user account' })
  @ApiResponse({ status: 200, description: 'Updated user account' })
  async moderateUser(
    @Param('id') userId: string,
    @Body() dto: ModerateUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    const user = await this.adminService.moderateUser(userId, dto, adminId);
    return {
      success: true,
      data: user,
    };
  }

  @Get('properties')
  @ApiOperation({ summary: 'List properties with approval filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'approvalStatus', required: false })
  @ApiResponse({ status: 200, description: 'List of properties' })
  async getProperties(
    @Query('status') status?: PropertyStatus,
    @Query('approvalStatus') approvalStatus?: ApprovalStatus,
  ) {
    const properties = await this.adminService.getProperties({ status, approvalStatus });
    return {
      success: true,
      data: properties,
    };
  }

  @Patch('properties/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, reject, or suspend a property listing' })
  @ApiResponse({ status: 200, description: 'Updated property approval status' })
  async moderateProperty(
    @Param('id') propertyId: string,
    @Body() dto: ModerateEntityDto,
    @CurrentUser('id') adminId: string,
  ) {
    const property = await this.adminService.moderateProperty(propertyId, dto, adminId);
    return {
      success: true,
      data: property,
    };
  }

  @Get('messes')
  @ApiOperation({ summary: 'List food service mess outlets with approval filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'approvalStatus', required: false })
  @ApiResponse({ status: 200, description: 'List of mess outlets' })
  async getMesses(
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: ApprovalStatus,
  ) {
    const messes = await this.adminService.getMesses({ status, approvalStatus });
    return {
      success: true,
      data: messes,
    };
  }

  @Patch('messes/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, reject, or suspend a food service mess outlet' })
  @ApiResponse({ status: 200, description: 'Updated mess approval status' })
  async moderateMess(
    @Param('id') messId: string,
    @Body() dto: ModerateEntityDto,
    @CurrentUser('id') adminId: string,
  ) {
    const mess = await this.adminService.moderateMess(messId, dto, adminId);
    return {
      success: true,
      data: mess,
    };
  }

  @Get('media')
  @ApiOperation({ summary: 'List all uploaded media items for admin moderation' })
  @ApiQuery({ name: 'reviewStatus', required: false })
  @ApiResponse({ status: 200, description: 'List of media items' })
  async getMedia(@Query('reviewStatus') reviewStatus?: MediaReviewStatus) {
    const media = await this.adminService.getAllMedia({ reviewStatus });
    return {
      success: true,
      data: media,
    };
  }

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
