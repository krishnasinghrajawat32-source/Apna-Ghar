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
import { Public } from '../../common/decorators/public.decorator';
import { FoodService } from './food.service';
import {
  CreateMenuDto,
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateMealPlanDto,
  CreateFoodOrderDto,
  UpdateFoodOrderStatusDto,
  CreateFoodSubscriptionDto,
} from './food.dto';
import { UserRole, AuthenticatedUser } from '@apnaghar/shared-types';

@ApiTags('Food Marketplace')
@Controller()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  // ==========================================
  // 1. FOOD PARTNER ROUTES
  // ==========================================

  @Post('food-partner/menus')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOOD_PARTNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update active daily tiffin menu (Partner Only)' })
  @ApiResponse({ status: 201, description: 'Menu created' })
  async createMenu(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMenuDto,
  ) {
    return this.foodService.createOrUpdateMenu(user.id, dto);
  }

  @Post('food-partner/menus/:menuId/categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOOD_PARTNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a dish category to menu (Partner Only)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async addCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('menuId') menuId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.foodService.addCategory(user.id, menuId, dto);
  }

  @Post('food-partner/categories/:categoryId/items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOOD_PARTNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a food item to category (Partner Only)' })
  @ApiResponse({ status: 201, description: 'Menu item created' })
  async addMenuItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.foodService.addMenuItem(user.id, categoryId, dto);
  }

  @Post('food-partner/meal-plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOOD_PARTNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create recurring meal subscription plan (Partner Only)' })
  @ApiResponse({ status: 201, description: 'Meal plan published' })
  async createMealPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMealPlanDto,
  ) {
    return this.foodService.createMealPlan(user.id, dto);
  }

  @Get('food-partner/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOOD_PARTNER)
  @ApiOperation({ summary: 'List incoming food orders for current partner' })
  @ApiResponse({ status: 200, description: 'List of partner orders' })
  async getPartnerOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.foodService.getPartnerOrders(user.id);
  }

  @Patch('food-partner/orders/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FOOD_PARTNER)
  @ApiOperation({ summary: 'Update food order status (PLACED -> PREPARING -> DELIVERED)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFoodOrderStatusDto,
  ) {
    return this.foodService.updateOrderStatus(user.id, id, dto);
  }

  // ==========================================
  // 2. PUBLIC FOOD DISCOVERY
  // ==========================================

  @Public()
  @Get('food/partners')
  @ApiOperation({ summary: 'Browse verified food partners and meal kitchens' })
  @ApiResponse({ status: 200, description: 'List of food partners' })
  async getFoodPartners() {
    return this.foodService.getFoodPartners();
  }

  @Public()
  @Get('food/partners/:id/menu')
  @ApiOperation({ summary: 'Get active menu with categories and dishes for a food partner' })
  @ApiResponse({ status: 200, description: 'Partner menu' })
  async getPartnerMenu(@Param('id') id: string) {
    return this.foodService.getPartnerMenu(id);
  }

  @Public()
  @Get('food/partners/:id/meal-plans')
  @ApiOperation({ summary: 'Get available meal subscription plans for a food partner' })
  @ApiResponse({ status: 200, description: 'List of meal plans' })
  async getPartnerMealPlans(@Param('id') id: string) {
    return this.foodService.getPartnerMealPlans(id);
  }

  // ==========================================
  // 3. STUDENT ORDERS & SUBSCRIPTIONS
  // ==========================================

  @Post('food/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place an ad-hoc student meal order' })
  @ApiResponse({ status: 201, description: 'Order placed' })
  async placeOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFoodOrderDto,
  ) {
    return this.foodService.placeOrder(user.id, dto);
  }

  @Get('food/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student meal order history' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async getStudentOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.foodService.getStudentOrders(user.id);
  }

  @Post('food/subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe to a weekly or monthly student meal plan' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async createSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFoodSubscriptionDto,
  ) {
    return this.foodService.createSubscription(user.id, dto);
  }

  @Get('food/subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'List student active meal subscriptions' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  async getStudentSubscriptions(@CurrentUser() user: AuthenticatedUser) {
    return this.foodService.getStudentSubscriptions(user.id);
  }

  @Patch('food/subscriptions/:id/pause')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Pause an active meal subscription during semester breaks' })
  @ApiResponse({ status: 200, description: 'Subscription paused' })
  async pauseSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.foodService.pauseSubscription(user.id, id);
  }

  @Patch('food/subscriptions/:id/resume')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Resume a paused meal subscription' })
  @ApiResponse({ status: 200, description: 'Subscription resumed' })
  async resumeSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.foodService.resumeSubscription(user.id, id);
  }
}
