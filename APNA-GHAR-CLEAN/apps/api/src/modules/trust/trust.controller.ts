import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrustService } from './trust.service';
import { VerifyCheckpointDto } from './dto/verify-checkpoint.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Trust & Verification')
@Controller('properties')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Public()
  @Get(':id/trust-passport')
  @ApiOperation({ summary: 'Get 7-point audit Trust Passport for a property' })
  @ApiResponse({ status: 200, description: 'Trust Passport details' })
  async getPassport(@Param('id') propertyId: string) {
    const passport = await this.trustService.getPassportByPropertyId(propertyId);
    return {
      success: true,
      data: passport,
    };
  }

  @Public()
  @Get('slug/:slug/trust-passport')
  @ApiOperation({ summary: 'Get Trust Passport by property slug' })
  @ApiResponse({ status: 200, description: 'Trust Passport details' })
  async getPassportBySlug(@Param('slug') slug: string) {
    const passport = await this.trustService.getPassportByPropertySlug(slug);
    return {
      success: true,
      data: passport,
    };
  }

  @Post(':id/trust-passport/verify-checkpoint')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a specific verification checkpoint (Admin only)' })
  @ApiResponse({ status: 200, description: 'Updated Trust Passport' })
  async verifyCheckpoint(
    @Param('id') propertyId: string,
    @Body() dto: VerifyCheckpointDto,
    @CurrentUser('id') auditorId: string,
  ) {
    const passport = await this.trustService.verifyCheckpoint(propertyId, dto, auditorId);
    return {
      success: true,
      data: passport,
    };
  }

  @Post(':id/freshness/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm current bed availability and refresh availability timestamp' })
  @ApiResponse({ status: 200, description: 'Availability refreshed successfully' })
  async confirmFreshness(@Param('id') propertyId: string) {
    const result = await this.trustService.confirmAvailabilityFreshness(propertyId);
    return {
      success: true,
      data: result,
    };
  }
}
