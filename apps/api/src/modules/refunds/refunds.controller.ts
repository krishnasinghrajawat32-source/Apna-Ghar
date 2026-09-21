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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RefundsService } from './refunds.service';
import { CancelAndRefundDto } from './refunds.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Refunds & Cancellations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get('preview/:bookingId')
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Preview refund calculation according to days remaining before check-in' })
  @ApiResponse({ status: 200, description: 'Refund preview breakdown' })
  async previewRefund(@Param('bookingId') bookingId: string) {
    return this.refundsService.calculateCancellationRefund(bookingId);
  }

  @Post('cancel-and-refund/:bookingId')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute cancellation and initiate policy-driven refund' })
  @ApiResponse({ status: 200, description: 'Booking cancelled and refund initiated' })
  async cancelAndRefund(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CancelAndRefundDto,
  ) {
    return this.refundsService.cancelAndProcessRefund(user.id, user.role, bookingId, dto.reason);
  }
}
