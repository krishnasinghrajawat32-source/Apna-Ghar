import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new student, owner, or mess partner account' })
  @SwaggerResponse({ status: 201, description: 'User account created and verification OTP sent' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with 6-digit OTP and activate account' })
  @SwaggerResponse({ status: 200, description: 'Email verified and session established' })
  async verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket?.remoteAddress || '';

    const result = await this.authService.verifyEmailOtp(dto, userAgent, ipAddress);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('resend-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email OTP with 60s cooldown and hourly limit checks' })
  @SwaggerResponse({ status: 200, description: 'OTP re-dispatched if eligible' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @SwaggerResponse({ status: 200, description: 'Successfully authenticated' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket?.remoteAddress || '';

    const result = await this.authService.login(dto, userAgent, ipAddress);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke active session' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies?.['accessToken'];

    if (user?.userId) {
      await this.authService.logout(user.userId, token);
    }
    this.clearAuthCookies(res);

    return {
      message: 'Logged out successfully. Session revoked.',
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and obtain new access token' })
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.['refreshToken'] || bodyToken;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket?.remoteAddress || '';

    const result = await this.authService.refreshToken(rawToken, userAgent, ipAddress);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile and domain attributes' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.userId, user.role);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset instructions' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset OTP and obtain single-use challenge token' })
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset with challenge token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 mins
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.clearCookie('accessToken', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
  }
}
