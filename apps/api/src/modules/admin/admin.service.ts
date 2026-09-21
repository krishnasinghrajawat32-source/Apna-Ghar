import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  UpdateUserStatusDto,
  ResolveReportDto,
  CreateCommissionRuleDto,
  QueryUsersDto,
  QueryReportsDto,
} from './admin.dto';
import {
  UserRole,
  UserStatus,
  BedStatus,
  BookingStatus,
  PaymentStatus,
  AdminPlatformMetricsDto,
} from '@apnaghar/shared-types';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Aggregate high-level platform analytics, financial GMV, commission revenues, and inventory occupancy
   */
  async getPlatformAnalytics(): Promise<AdminPlatformMetricsDto> {
    const [
      totalUsers,
      studentsCount,
      ownersCount,
      foodPartnersCount,
      adminsCount,
      totalProperties,
      verifiedProperties,
      totalBeds,
      availableBeds,
      reservedBeds,
      occupiedBeds,
      confirmedPayments,
      foodOrders,
      totalBookings,
      totalFoodOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.STUDENT } }),
      this.prisma.user.count({ where: { role: UserRole.OWNER } }),
      this.prisma.user.count({ where: { role: UserRole.FOOD_PARTNER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { isVerified: true } }),
      this.prisma.bed.count(),
      this.prisma.bed.count({ where: { status: BedStatus.AVAILABLE } }),
      this.prisma.bed.count({ where: { status: BedStatus.RESERVED } }),
      this.prisma.bed.count({ where: { status: BedStatus.OCCUPIED } }),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCESS },
        select: { amount: true },
      }),
      this.prisma.foodOrder.findMany({
        select: { totalAmount: true },
      }),
      this.prisma.booking.count(),
      this.prisma.foodOrder.count(),
    ]);

    const bookingGmv = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const foodGmv = foodOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const platformGmv = Number((bookingGmv + foodGmv).toFixed(2));

    // Platform take-rate revenue (5% on accommodation bookings, 10% on food orders)
    const platformRevenue = Number((bookingGmv * 0.05 + foodGmv * 0.1).toFixed(2));

    const occupiedAndReserved = occupiedBeds + reservedBeds;
    const occupancyRate =
      totalBeds > 0 ? Number(((occupiedAndReserved / totalBeds) * 100).toFixed(1)) : 0.0;

    return {
      totalUsers: {
        total: totalUsers,
        students: studentsCount,
        owners: ownersCount,
        foodPartners: foodPartnersCount,
        admins: adminsCount,
      },
      inventory: {
        totalProperties,
        verifiedProperties,
        totalBeds,
        availableBeds,
        reservedBeds,
        occupiedBeds,
        occupancyRate,
      },
      financials: {
        platformGmv,
        platformRevenue,
        totalBookings,
        totalFoodOrders,
      },
    };
  }

  /**
   * Search and list platform users
   */
  async getUsers(query: QueryUsersDto) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.email = { contains: query.search, mode: 'insensitive' };
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          studentProfile: { select: { firstName: true, lastName: true, phone: true } },
          ownerProfile: { select: { fullName: true, businessName: true, phone: true } },
          foodPartnerProfile: { select: { kitchenName: true, phone: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: query.page || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Moderate user status (e.g. suspend or deactivate bad-actor accounts).
   * Automatically invalidates all active Redis session refresh tokens.
   */
  async updateUserStatus(adminUserId: string, targetUserId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN && user.id !== adminUserId) {
      throw new BadRequestException('Cannot modify status of other administrator accounts');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { status: dto.status },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: 'USER_STATUS_MODIFIED',
          entityType: 'USER',
          entityId: targetUserId,
          metadata: {
            previousStatus: user.status,
            newStatus: dto.status,
            reason: dto.reason || 'Admin action',
          },
        },
      });

      return u;
    });

    // Invalidate Redis sessions if suspended or deactivated
    if (dto.status === UserStatus.SUSPENDED || dto.status === UserStatus.DEACTIVATED) {
      await this.redis.del(`user:sessions:${targetUserId}`);
    }

    return updatedUser;
  }

  /**
   * List platform abuse and grievance reports
   */
  async getReports(query: QueryReportsDto) {
    const where: any = {};
    if (query.isResolved !== undefined) where.isResolved = query.isResolved;
    if (query.entityType) where.entityType = query.entityType;

    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true, role: true } },
          reportedUser: { select: { id: true, email: true, role: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page: query.page || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Resolve an abuse report and record resolution notes
   */
  async resolveReport(adminUserId: string, reportId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.report.update({
        where: { id: reportId },
        data: {
          isResolved: dto.isResolved,
          resolvedNotes: dto.resolutionNotes,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: 'REPORT_RESOLVED',
          entityType: 'REPORT',
          entityId: reportId,
          metadata: {
            actionTaken: dto.actionTaken,
            resolutionNotes: dto.resolutionNotes,
          },
        },
      });

      return r;
    });

    return updated;
  }

  /**
   * Create or update platform take-rate commission rules
   */
  async createCommissionRule(dto: CreateCommissionRuleDto) {
    const rule = await this.prisma.commissionRule.create({
      data: {
        role: dto.role,
        percentage: dto.percentage,
        flatFee: dto.flatFee || 0.0,
        appliesTo: dto.appliesTo,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        isActive: true,
      },
    });

    return rule;
  }

  /**
   * List all active platform commission rules
   */
  async getCommissionRules() {
    return this.prisma.commissionRule.findMany({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
