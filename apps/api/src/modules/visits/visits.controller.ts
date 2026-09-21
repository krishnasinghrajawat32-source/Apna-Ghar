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
import { VisitsService } from './visits.service';
import { CreateVisitDto, UpdateVisitDto, CancelVisitDto } from './visits.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post('visits')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a physical property visit (Student Only)' })
  @ApiResponse({ status: 201, description: 'Visit scheduled' })
  async createVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVisitDto,
  ) {
    return this.visitsService.createVisit(user.id, dto);
  }

  @Get('visits')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'List all scheduled visits for current student' })
  @ApiResponse({ status: 200, description: 'List of visits' })
  async getStudentVisits(@CurrentUser() user: AuthenticatedUser) {
    return this.visitsService.getStudentVisits(user.id);
  }

  @Patch('visits/:id/cancel')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Cancel a scheduled visit (Student Only)' })
  @ApiResponse({ status: 200, description: 'Visit cancelled' })
  async cancelVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelVisitDto,
  ) {
    return this.visitsService.cancelVisitByStudent(user.id, id, dto.reason);
  }

  @Get('owner/visits')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'List incoming visits for all owned properties (Owner Only)' })
  @ApiResponse({ status: 200, description: 'List of owner visits' })
  async getOwnerVisits(@CurrentUser() user: AuthenticatedUser) {
    return this.visitsService.getOwnerVisits(user.id);
  }

  @Patch('owner/visits/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Confirm, reschedule, or complete a visit (Owner Only)' })
  @ApiResponse({ status: 200, description: 'Visit updated' })
  async updateVisitByOwner(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
  ) {
    return this.visitsService.updateVisitByOwner(user.id, id, dto);
  }
}
