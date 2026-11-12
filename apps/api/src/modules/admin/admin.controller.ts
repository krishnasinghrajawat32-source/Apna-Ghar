import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole, PropertyStatus, ApprovalStatus, MediaReviewStatus } from '@apna-ghar/shared-types';
import { AdminService } from './admin.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
import { ModerateEntityDto, ModerateUserDto } from './dto/moderate-entity.dto';
import { ModerateRoleApprovalDto } from './dto/moderate-role-approval.dto';
import { AdminUsersQueryDto, AdminAuditLogQueryDto } from './dto/admin-users-query.dto';
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

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get real-time database counts for roles, verification, presence, and approvals' })
  @ApiResponse({ status: 200, description: 'Live platform administration metrics' })
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'List user accounts with search, role filters, and live presence status' })
  @ApiResponse({ status: 200, description: 'Paginated user directory' })
  async getUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.adminService.getUsersPaginated(query);
    return {
      success: true,
      data: result.users,
      meta: result.meta,
    };
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend or reactivate user account (suspension revokes all sessions)' })
  @ApiResponse({ status: 200, description: 'Updated user account' })
  async moderateUser(
    @Param('id') userId: string,
    @Body() dto: ModerateUserDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const user = await this.adminService.moderateUser(userId, dto, adminId, ipAddress);
    return {
      success: true,
      data: user,
    };
  }

  @Patch('users/:id/role-approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject role application for Owner or Mess Partner' })
  @ApiResponse({ status: 200, description: 'Updated role approval status' })
  async moderateRoleApproval(
    @Param('id') userId: string,
    @Body() dto: ModerateRoleApprovalDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const user = await this.adminService.moderateUserRoleApproval(userId, dto, adminId, ipAddress);
    return {
      success: true,
      data: user,
    };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated append-only administrator audit trail' })
  @ApiResponse({ status: 200, description: 'List of audit events' })
  async getAuditLogs(@Query() query: AdminAuditLogQueryDto) {
    const result = await this.adminService.getAuditLogs(query);
    return {
      success: true,
      data: result.logs,
      meta: result.meta,
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
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const property = await this.adminService.moderateProperty(propertyId, dto, adminId, ipAddress);
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
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const mess = await this.adminService.moderateMess(messId, dto, adminId, ipAddress);
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

  @Patch('trust-audits/:propertyId/checkpoints')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Audit and verify/reject a specific Trust Passport checkpoint' })
  @ApiResponse({ status: 200, description: 'Updated Trust Passport checkpoint' })
  async verifyTrustCheckpoint(
    @Param('propertyId') propertyId: string,
    @Body() dto: VerifyCheckpointDto,
    @CurrentUser('id') adminId: string,
  ) {
    const updated = await this.adminService.verifyTrustCheckpoint(propertyId, dto, adminId);
    return {
      success: true,
      data: updated,
    };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List all property reviews for administrative content moderation' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getReviews() {
    const reviews = await this.adminService.getAllReviews();
    return {
      success: true,
      data: reviews,
    };
  }

  @Patch('reviews/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish or reject a student property review' })
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
