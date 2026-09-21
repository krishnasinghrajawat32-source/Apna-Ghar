import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  UpdateUserStatusDto,
  ResolveReportDto,
  CreateCommissionRuleDto,
  QueryUsersDto,
  QueryReportsDto,
} from './admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apnaghar/shared-types';

@ApiTags('Admin Console & Governance')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({
    summary: 'Platform Analytics & Revenue Dashboard',
    description:
      'Calculates platform GMV, commission revenues, user role distributions, inventory totals, and occupancy rates.',
  })
  async getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'Search and list platform registered accounts' })
  async getUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/status')
  @ApiOperation({
    summary: 'Moderate user account status (e.g. suspend bad actors)',
    description: 'Updates user status and flushes active sessions from Redis.',
  })
  async updateUserStatus(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(adminUserId, targetUserId, dto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List platform abuse and grievance reports' })
  async getReports(@Query() query: QueryReportsDto) {
    return this.adminService.getReports(query);
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Arbitrate and resolve an abuse report' })
  async resolveReport(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminService.resolveReport(adminUserId, reportId, dto);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'List platform take-rate commission rules' })
  async getCommissionRules() {
    return this.adminService.getCommissionRules();
  }

  @Post('commissions')
  @ApiOperation({ summary: 'Create a new platform commission rule' })
  @HttpCode(HttpStatus.CREATED)
  async createCommissionRule(@Body() dto: CreateCommissionRuleDto) {
    return this.adminService.createCommissionRule(dto);
  }
}
