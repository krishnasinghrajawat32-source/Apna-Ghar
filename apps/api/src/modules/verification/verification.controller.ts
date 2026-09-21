import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Property Verification (KYC & Deeds)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('owner/properties/:propertyId/verification')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit ownership deeds / electricity bills for property verification (Owner Only)' })
  @ApiResponse({ status: 201, description: 'Verification documents submitted and placed in queue' })
  async submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: SubmitVerificationDto,
  ) {
    return this.verificationService.submitVerification(user.id, propertyId, dto);
  }

  @Get('admin/verifications')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get queue of pending property verification submissions (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Queue of pending verifications' })
  async getPendingVerifications() {
    return this.verificationService.getPendingVerifications();
  }

  @Patch('admin/verifications/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or Reject property verification with audit trail (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Verification processed' })
  async reviewVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') verificationId: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.verificationService.reviewVerification(user.id, verificationId, dto);
  }
}
