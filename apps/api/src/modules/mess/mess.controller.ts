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
}
