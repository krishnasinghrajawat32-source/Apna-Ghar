import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('RBAC Verification Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('test-rbac')
export class TestRbacController {
  @Get('student-only')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Endpoint accessible only by STUDENT role' })
  @ApiResponse({ status: 200, description: 'Access granted to Student' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-students' })
  testStudent(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Welcome Student! RBAC verified successfully.',
      user,
    };
  }

  @Get('owner-only')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Endpoint accessible only by OWNER role' })
  @ApiResponse({ status: 200, description: 'Access granted to Owner' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-owners' })
  testOwner(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Welcome Property Owner! RBAC verified successfully.',
      user,
    };
  }

  @Get('food-partner-only')
  @Roles(UserRole.FOOD_PARTNER)
  @ApiOperation({ summary: 'Endpoint accessible only by FOOD_PARTNER role' })
  @ApiResponse({ status: 200, description: 'Access granted to Food Partner' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-food-partners' })
  testFoodPartner(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Welcome Food Partner! RBAC verified successfully.',
      user,
    };
  }

  @Get('admin-only')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Endpoint accessible only by ADMIN role' })
  @ApiResponse({ status: 200, description: 'Access granted to Admin' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admins' })
  testAdmin(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Welcome Administrator! High-security RBAC verified successfully.',
      user,
    };
  }
}
