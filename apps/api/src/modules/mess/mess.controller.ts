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
import { MessService } from './mess.service';
import { CreateMessSubscriptionDto } from './dto/create-mess-subscription.dto';
import { UpdateWeeklyMenuDto } from './dto/update-weekly-menu.dto';
import { CreateMessDto } from './dto/create-mess.dto';
import { UpdateMessDto } from './dto/update-mess.dto';
import { UpdateMealPlansDto } from './dto/update-meal-plans.dto';
import { SubscriptionDecisionDto } from './dto/subscription-decision.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@apna-ghar/shared-types';

@ApiTags('Mess & Meal Plan Subscriptions')
@Controller('mess')
export class MessController {
  constructor(private readonly messService: MessService) {}

  @Get('partner/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get food vendor partner profile details' })
  @ApiResponse({ status: 200, description: 'Vendor partner profile' })
  async getPartnerProfile(@CurrentUser('id') partnerId: string) {
    const profile = await this.messService.getPartnerProfile(partnerId);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('partner/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update food vendor partner profile details' })
  @ApiResponse({ status: 200, description: 'Updated vendor profile' })
  async updatePartnerProfile(
    @CurrentUser('id') partnerId: string,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    const profile = await this.messService.updatePartnerProfile(partnerId, dto);
    return {
      success: true,
      data: profile,
    };
  }

  @Post('partner/outlet')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new mess/tiffin service outlet' })
  @ApiResponse({ status: 201, description: 'Mess outlet created (pending verification)' })
  async createPartnerMess(
    @CurrentUser('id') partnerId: string,
    @Body() dto: CreateMessDto,
  ) {
    const mess = await this.messService.createPartnerMess(partnerId, dto);
    return {
      success: true,
      data: mess,
    };
  }

  @Patch('partner/outlet')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update mess outlet service details and delivery configuration' })
  @ApiResponse({ status: 200, description: 'Updated mess outlet' })
  async updatePartnerMess(
    @CurrentUser('id') partnerId: string,
    @CurrentUser('role') role: UserRole,
    @Query('messId') messId: string,
    @Body() dto: UpdateMessDto,
  ) {
    const targetMessId = messId || (await this.messService.getPartnerMess(partnerId))?._id.toString();
    const mess = await this.messService.updatePartnerMess(partnerId, targetMessId!, role, dto);
    return {
      success: true,
      data: mess,
    };
  }

  @Patch('partner/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update monthly meal plans (pricing for listing display only)' })
  @ApiResponse({ status: 200, description: 'Updated meal plans' })
  async updateMealPlans(
    @CurrentUser('id') partnerId: string,
    @CurrentUser('role') role: UserRole,
    @Query('messId') messId: string,
    @Body() dto: UpdateMealPlansDto,
  ) {
    const targetMessId = messId || (await this.messService.getPartnerMess(partnerId))?._id.toString();
    const mess = await this.messService.updateMealPlans(partnerId, targetMessId!, role, dto);
    return {
      success: true,
      data: mess,
    };
  }

  @Patch('partner/subscriptions/:id/decision')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor accepts or rejects student subscription/order request' })
  @ApiResponse({ status: 200, description: 'Decision recorded (not a paid transaction)' })
  async decideSubscription(
    @Param('id') subscriptionId: string,
    @CurrentUser('id') partnerId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: SubscriptionDecisionDto,
  ) {
    const sub = await this.messService.decideSubscription(partnerId, subscriptionId, role, dto);
    return {
      success: true,
      data: sub,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Discover verified student messes with dietary filtering' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'dietaryType', required: false })
  @ApiResponse({ status: 200, description: 'List of verified mess outlets' })
  async findAll(
    @Query('city') city?: string,
    @Query('dietaryType') dietaryType?: string,
  ) {
    const messes = await this.messService.findAll({ city, dietaryType });
    return {
      success: true,
      data: messes,
    };
  }

  @Post('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe to a monthly mess meal plan' })
  @ApiResponse({ status: 201, description: 'Mess subscription created with QR meal pass' })
  async createSubscription(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateMessSubscriptionDto,
  ) {
    const subscription = await this.messService.createSubscription(studentId, dto);
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('subscriptions/student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'List active meal plan subscriptions for logged-in student' })
  @ApiResponse({ status: 200, description: 'List of student meal passes' })
  async getStudentSubscriptions(@CurrentUser('id') studentId: string) {
    const subscriptions = await this.messService.getStudentSubscriptions(studentId);
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Get('partner/my-mess')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get mess outlet profile managed by logged-in partner' })
  @ApiResponse({ status: 200, description: 'Mess partner profile' })
  async getPartnerMess(@CurrentUser('id') partnerId: string) {
    const mess = await this.messService.getPartnerMess(partnerId);
    return {
      success: true,
      data: mess,
    };
  }

  @Patch('partner/weekly-menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update weekly rotating breakfast/lunch/dinner menu' })
  @ApiResponse({ status: 200, description: 'Weekly menu updated' })
  async updateWeeklyMenu(
    @CurrentUser('id') partnerId: string,
    @Query('messId') messId: string,
    @Body() dto: UpdateWeeklyMenuDto,
  ) {
    const mess = await this.messService.updateWeeklyMenu(partnerId, messId, dto.weeklyMenu);
    return {
      success: true,
      data: mess,
    };
  }

  @Get('partner/subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MESS_PARTNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List active student meal plan subscribers' })
  @ApiResponse({ status: 200, description: 'List of current subscribers' })
  async getPartnerSubscribers(@CurrentUser('id') partnerId: string) {
    const subscribers = await this.messService.getPartnerSubscriptions(partnerId);
    return {
      success: true,
      data: subscribers,
    };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get mess outlet profile, subscription plans, and rotating weekly menu' })
  @ApiResponse({ status: 200, description: 'Mess profile detail' })
  async findBySlug(@Param('slug') slug: string) {
    const mess = await this.messService.findBySlug(slug);
    return {
      success: true,
      data: mess,
    };
  }
}
