import {
  Controller,
  Get,
  Post,
  Delete,
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
import { FavoritesService } from './favorites.service';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':propertyId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save property to student favorites (Student Only)' })
  @ApiResponse({ status: 201, description: 'Property saved to favorites' })
  async addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.addFavorite(user.id, propertyId);
  }

  @Delete(':propertyId')
  @ApiOperation({ summary: 'Remove property from student favorites' })
  @ApiResponse({ status: 200, description: 'Property removed from favorites' })
  async removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.favoritesService.removeFavorite(user.id, propertyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved properties for current student' })
  @ApiResponse({ status: 200, description: 'List of favorited properties' })
  async getFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.getFavorites(user.id);
  }
}
