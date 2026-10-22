import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Visits & Scheduling')
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Public()
  @Get('slots')
  @ApiOperation({ summary: 'Get available visit slots for a property on a given date' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-10-25' })
  @ApiResponse({ status: 200, description: 'Available time slots' })
  async getAvailableSlots(
    @Query('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    const slots = await this.visitsService.getAvailableSlots(propertyId, date);
    return {
      success: true,
      data: slots,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a free physical visit to a property' })
  @ApiResponse({ status: 201, description: 'Visit successfully requested' })
  async createVisit(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateVisitDto,
  ) {
    const visit = await this.visitsService.createVisit(studentId, dto);
    return {
      success: true,
      data: visit,
    };
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'List visits scheduled by the current student' })
  @ApiResponse({ status: 200, description: 'List of student visits' })
  async getStudentVisits(@CurrentUser('id') studentId: string) {
    const visits = await this.visitsService.getStudentVisits(studentId);
    return {
      success: true,
      data: visits,
    };
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List visits scheduled for properties owned by the current user' })
  @ApiResponse({ status: 200, description: 'List of owner visits' })
  async getOwnerVisits(@CurrentUser('id') ownerId: string) {
    const visits = await this.visitsService.getOwnerVisits(ownerId);
    return {
      success: true,
      data: visits,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get visit details by ID' })
  @ApiResponse({ status: 200, description: 'Visit details' })
  async getVisitById(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const visit = await this.visitsService.getVisitById(visitId, userId, role);
    return {
      success: true,
      data: visit,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update visit status (cancel, confirm, reject, complete)' })
  @ApiResponse({ status: 200, description: 'Updated visit record' })
  async updateStatus(
    @Param('id') visitId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateVisitStatusDto,
  ) {
    const visit = await this.visitsService.updateVisitStatus(visitId, userId, role, dto);
    return {
      success: true,
      data: visit,
    };
  }
}
