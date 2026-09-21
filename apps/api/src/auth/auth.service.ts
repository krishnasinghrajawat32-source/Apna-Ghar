import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MongoDbService } from '../common/database/mongodb.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus, AuthenticatedUser } from '@apnaghar/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    @Optional() private readonly mongoDb?: MongoDbService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email address already exists.',
        },
      });
    }

    // Hash password with bcryptjs (salt rounds: 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Atomic creation of central User and specialized Profile
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: dto.role as any,
          status: 'ACTIVE',
          emailVerified: false,
        },
      });

      if (dto.role === UserRole.STUDENT) {
        await tx.studentProfile.create({
          data: {
            user: { connect: { id: user.id } },
            firstName: dto.firstName || 'Student',
            lastName: dto.lastName || 'User',
            phone: dto.phone,
            college: dto.collegeId ? { connect: { id: dto.collegeId } } : undefined,
            gender: dto.gender as any,
          },
        });
      } else if (dto.role === UserRole.OWNER) {
        await tx.ownerProfile.create({
          data: {
            user: { connect: { id: user.id } },
            fullName: dto.fullName || 'Property Owner',
            businessName: dto.businessName,
            phone: dto.phone || 'Pending',
          },
        });
      } else if (dto.role === UserRole.FOOD_PARTNER) {
        await tx.foodPartnerProfile.create({
          data: {
            user: { connect: { id: user.id } },
            kitchenName: dto.kitchenName || 'Mess Partner',
            contactPerson: dto.contactPerson || 'Kitchen Manager',
            phone: dto.phone || 'Pending',
            address: dto.address || 'Address pending',
            serviceStartTime: '07:00',
            serviceEndTime: '22:00',
            latitude: new Prisma.Decimal(dto.latitude ?? 28.5450),
            longitude: new Prisma.Decimal(dto.longitude ?? 77.1926),
          },
        });
      }

      return user;
    });

    const tokens = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.role as string,
      newUser.status as string,
    );

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role as unknown as UserRole,
        status: newUser.status as unknown as UserStatus,
        emailVerified: newUser.emailVerified,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    let user: any = null;
    try {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
    } catch {
      // Prisma offline, fallback to MongoDB
    }

    if (!user && this.mongoDb) {
      const usersCol = this.mongoDb.getCollection('users');
      if (usersCol) {
        user = await usersCol.findOne({ email: dto.email.toLowerCase() });
      }
    }

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: `Your account has been ${user.status.toLowerCase()}. Contact Apna Ghar Support.`,
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Update lastLoginAt timestamp
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      if (this.mongoDb) {
        const usersCol = this.mongoDb.getCollection('users');
        if (usersCol) {
          await usersCol.updateOne({ email: user.email }, { $set: { lastLoginAt: new Date() } });
        }
      }
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role as string,
      user.status as string,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as unknown as UserRole,
        status: user.status as unknown as UserStatus,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.redis.del(`session:refresh:${refreshToken}`);
    }
    await this.redis.del(`user:sessions:${userId}`);
    return { loggedOut: true };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'TOKEN_REQUIRED',
          message: 'Refresh token is required.',
        },
      });
    }

    const sessionDataStr = await this.redis.get(`session:refresh:${refreshToken}`);
    if (!sessionDataStr) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or has expired. Please login again.',
        },
      });
    }

    const sessionData = JSON.parse(sessionDataStr);
    const user = await this.prisma.user.findUnique({
      where: { id: sessionData.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      await this.redis.del(`session:refresh:${refreshToken}`);
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'ACCOUNT_INACCESSIBLE',
          message: 'User account is inactive or not found.',
        },
      });
    }

    // Invalidate old refresh token (Rotation security)
    await this.redis.del(`session:refresh:${refreshToken}`);

    // Generate new tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role as string,
      user.status as string,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as unknown as UserRole,
        status: user.status as unknown as UserStatus,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  async getCurrentProfile(user: AuthenticatedUser) {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        studentProfile: true,
        ownerProfile: true,
        foodPartnerProfile: true,
      },
    });

    if (!fullUser) {
      throw new NotFoundException('User profile not found');
    }

    return fullUser;
  }

  private async generateTokens(userId: string, email: string, role: string, status: string) {
    const payload = {
      sub: userId,
      email,
      role,
      status,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration'),
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTtlSeconds = 7 * 24 * 60 * 60; // 7 days

    await this.redis.set(
      `session:refresh:${refreshToken}`,
      JSON.stringify({ userId, role, createdAt: new Date().toISOString() }),
      'EX',
      refreshTtlSeconds,
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
