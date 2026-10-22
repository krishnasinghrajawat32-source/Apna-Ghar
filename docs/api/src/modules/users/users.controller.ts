import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateRoommatePreferencesDto } from './dto/update-roommate-preferences.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Users & Student Profiles')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('roommate-preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current student roommate preferences' })
  @ApiResponse({ status: 200, description: 'Student roommate preferences' })
  async getRoommatePreferences(@CurrentUser('id') userId: string) {
    const preferences = await this.usersService.getRoommatePreferences(userId);
    return {
      success: true,
      data: preferences,
    };
  }

  @Patch('roommate-preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update student roommate preferences' })
  @ApiResponse({ status: 200, description: 'Updated roommate preferences' })
  async updateRoommatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRoommatePreferencesDto,
  ) {
    const updated = await this.usersService.updateRoommatePreferences(userId, dto);
    return {
      success: true,
      data: updated,
    };
  }
}
