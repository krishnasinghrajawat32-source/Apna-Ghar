import {
  Controller,
  Get,
  Post,
  Patch,
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
import { DisputesService } from './disputes.service';
import { CreateDisputeDto, AddEvidenceDto, ResolveDisputeDto } from './disputes.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Disputes & Arbitration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('disputes')
  @Roles(UserRole.STUDENT, UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Raise a formal dispute against a booking' })
  @ApiResponse({ status: 201, description: 'Dispute created' })
  async raiseDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.raiseDispute(user.id, user.role, dto);
  }

  @Post('disputes/:id/evidence')
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload and attach document/photo evidence to an open dispute' })
  @ApiResponse({ status: 201, description: 'Evidence attached' })
  async addEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddEvidenceDto,
  ) {
    return this.disputesService.addEvidence(user.id, id, dto);
  }

  @Get('disputes')
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List disputes relevant to the requesting user role' })
  @ApiResponse({ status: 200, description: 'List of disputes' })
  async getDisputes(@CurrentUser() user: AuthenticatedUser) {
    return this.disputesService.getDisputes(user.id, user.role);
  }

  @Patch('admin/disputes/:id/resolve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Arbitrate and resolve a dispute (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Dispute resolved' })
  async resolveDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(user.id, id, dto);
  }
}
