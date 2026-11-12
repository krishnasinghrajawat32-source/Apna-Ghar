import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserRole,
  UserStatus,
  AccountStatus,
  RoleApprovalStatus,
  PresenceStatus,
  BookingStatus,
  PaymentStatus,
  ReviewStatus,
  AdminOverviewStats,
  AdminTrustAuditItem,
  Review as IReview,
  VerificationStatus,
  PropertyStatus,
  ApprovalStatus,
  MediaReviewStatus,
  AdminDashboardStats,
  SessionRevocationReason,
} from '@apna-ghar/shared-types';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { TrustPassport, TrustPassportDocument } from '../trust/schemas/trust-passport.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Mess, MessDocument } from '../mess/schemas/mess.schema';
import {
  Media,
  MediaDocument,
  Session,
  SessionDocument,
  AdminAuditLog,
  AdminAuditLogDocument,
} from '@apna-ghar/database';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from '../reviews/reviews.service';
import { SessionService } from '../auth/services/session.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
import { ModerateEntityDto, ModerateUserDto } from './dto/moderate-entity.dto';
import { ModerateRoleApprovalDto } from './dto/moderate-role-approval.dto';
import { AdminUsersQueryDto, AdminAuditLogQueryDto } from './dto/admin-users-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(TrustPassport.name) private readonly trustPassportModel: Model<TrustPassportDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Mess.name) private readonly messModel: Model<MessDocument>,
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(AdminAuditLog.name) private readonly adminAuditLogModel: Model<AdminAuditLogDocument>,
    private readonly trustService: TrustService,
    private readonly reviewsService: ReviewsService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Real database aggregate counts for admin command center.
   * NO payment, revenue, or earnings calculations fabricated.
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const [
      totalUsers,
      studentsCount,
      ownersCount,
      messPartnersCount,
      adminsCount,
      activeStatusCount,
      pendingVerificationStatusCount,
      suspendedStatusCount,
      emailVerifiedCount,
      emailUnverifiedCount,
      onlineUserIds,
      pendingApprovalCount,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ role: UserRole.STUDENT }).exec(),
      this.userModel.countDocuments({ role: UserRole.OWNER }).exec(),
      this.userModel.countDocuments({ role: UserRole.MESS_PARTNER }).exec(),
      this.userModel.countDocuments({ role: UserRole.ADMIN }).exec(),
      this.userModel.countDocuments({
        $or: [{ accountStatus: AccountStatus.ACTIVE }, { status: UserStatus.ACTIVE }],
      }).exec(),
      this.userModel.countDocuments({
        $or: [
          { accountStatus: AccountStatus.PENDING_VERIFICATION },
          { status: UserStatus.PENDING_VERIFICATION },
        ],
      }).exec(),
      this.userModel.countDocuments({
        $or: [{ accountStatus: AccountStatus.SUSPENDED }, { status: UserStatus.SUSPENDED }],
      }).exec(),
      this.userModel.countDocuments({ emailVerified: true }).exec(),
      this.userModel.countDocuments({ emailVerified: false }).exec(),
      this.sessionModel.distinct('userId', {
        isRevoked: false,
        expiresAt: { $gt: now },
        lastActivityAt: { $gte: fifteenMinutesAgo },
      }).exec(),
      this.userModel.countDocuments({
        role: { $in: [UserRole.OWNER, UserRole.MESS_PARTNER] },
        roleApprovalStatus: RoleApprovalStatus.PENDING,
      }).exec(),
      this.userModel.countDocuments({
        role: { $in: [UserRole.OWNER, UserRole.MESS_PARTNER] },
        roleApprovalStatus: RoleApprovalStatus.APPROVED,
      }).exec(),
      this.userModel.countDocuments({
        role: { $in: [UserRole.OWNER, UserRole.MESS_PARTNER] },
        roleApprovalStatus: RoleApprovalStatus.REJECTED,
      }).exec(),
    ]);

    const onlineCount = (onlineUserIds as Types.ObjectId[]).length;
    const offlineCount = Math.max(0, totalUsers - onlineCount);

    return {
      totalUsers,
      roles: {
        students: studentsCount,
        owners: ownersCount,
        messPartners: messPartnersCount,
        admins: adminsCount,
      },
      accountStatus: {
        active: activeStatusCount,
        pendingVerification: pendingVerificationStatusCount,
        suspended: suspendedStatusCount,
      },
      emailVerification: {
        verified: emailVerifiedCount,
        unverified: emailUnverifiedCount,
      },
      presence: {
        online: onlineCount,
        offline: offlineCount,
      },
      roleApprovals: {
        pending: pendingApprovalCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    };
  }

  /**
   * Paginated user list with search, status filtering, and real-time presence indicators
   */
  async getUsersPaginated(query: AdminUsersQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 12));
    const skip = (page - 1) * limit;

    const mongoQuery: Record<string, unknown> = {};

    if (query.role) {
      mongoQuery.role = query.role;
    }

    if (query.accountStatus) {
      mongoQuery.$or = [
        { accountStatus: query.accountStatus },
        { status: query.accountStatus },
      ];
    }

    if (query.emailVerified !== undefined) {
      mongoQuery.emailVerified = query.emailVerified;
    }

    if (query.roleApprovalStatus) {
      mongoQuery.roleApprovalStatus = query.roleApprovalStatus;
    }

    if (query.search) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      mongoQuery.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(mongoQuery)
        .select('-passwordHash -refreshTokenHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(mongoQuery).exec(),
    ]);

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const now = new Date();

    // Map presence status and active session count
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const [hasActiveRecentSession, activeSessionsCount] = await Promise.all([
          this.sessionModel.exists({
            userId: u._id,
            isRevoked: false,
            expiresAt: { $gt: now },
            lastActivityAt: { $gte: fifteenMinutesAgo },
          }),
          this.sessionModel.countDocuments({
            userId: u._id,
            isRevoked: false,
            expiresAt: { $gt: now },
          }),
        ]);

        const uObj = u.toJSON() as Record<string, unknown>;
        uObj.presenceStatus = hasActiveRecentSession ? PresenceStatus.ACTIVE : PresenceStatus.INACTIVE;
        uObj.activeSessionCount = activeSessionsCount;
        return uObj;
      }),
    );

    return {
      users: enrichedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
      },
    };
  }

  /**
   * Admin approves or rejects role approval for Owner or Mess Partner
   */
  async moderateUserRoleApproval(
    userId: string,
    dto: ModerateRoleApprovalDto,
    adminId: string,
    ipAddress?: string,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const admin = await this.userModel.findById(adminId);
    const previousStatus = user.roleApprovalStatus;
    user.roleApprovalStatus = dto.status;
    await user.save();

    // Append-only audit record
    await this.adminAuditLogModel.create({
      adminId: new Types.ObjectId(adminId),
      adminEmail: admin?.email || '',
      action: dto.status === RoleApprovalStatus.APPROVED ? 'ROLE_APPROVED' : 'ROLE_REJECTED',
      targetType: 'USER',
      targetId: user._id.toString(),
      reason: dto.reason || null,
      diff: {
        role: user.role,
        previousRoleApprovalStatus: previousStatus,
        newRoleApprovalStatus: dto.status,
      },
      ipAddress: ipAddress || null,
    });

    this.logger.log(`User ${user.email} role approval updated to ${dto.status} by admin ${adminId}`);
    return user;
  }

  /**
   * Admin suspends or activates user account.
   * Suspending revokes ALL active sessions immediately.
   */
  async moderateUser(
    userId: string,
    dto: ModerateUserDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const admin = await this.userModel.findById(adminId);
    const previousAccountStatus = user.accountStatus;
    user.accountStatus = dto.status as AccountStatus;
    user.status = dto.status as UserStatus;

    let sessionsRevoked = 0;
    if (dto.status === 'SUSPENDED') {
      sessionsRevoked = await this.sessionService.revokeAllUserSessions(
        user._id.toString(),
        SessionRevocationReason.ADMIN_SUSPENSION,
      );
      user.refreshTokenHash = null;
    }

    await user.save();

    // Audit log
    await this.adminAuditLogModel.create({
      adminId: new Types.ObjectId(adminId),
      adminEmail: admin?.email || '',
      action: dto.status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      targetType: 'USER',
      targetId: user._id.toString(),
      reason: dto.reason || null,
      diff: {
        previousAccountStatus,
        newAccountStatus: dto.status,
        sessionsRevoked,
      },
      ipAddress: ipAddress || null,
    });

    this.logger.log(`User ${user.email} status updated to ${dto.status} by admin ${adminId}`);
    return user;
  }

  /**
   * Retrieves paginated admin audit logs
   */
  async getAuditLogs(query: AdminAuditLogQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const mongoQuery: Record<string, unknown> = {};
    if (query.targetType) mongoQuery.targetType = query.targetType;
    if (query.targetId) mongoQuery.targetId = query.targetId;
    if (query.action) mongoQuery.action = new RegExp(query.action.trim(), 'i');

    const [logs, total] = await Promise.all([
      this.adminAuditLogModel
        .find(mongoQuery)
        .populate('adminId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.adminAuditLogModel.countDocuments(mongoQuery).exec(),
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
      },
    };
  }

  /**
   * Aggregates platform-wide Key Performance Indicators
   */
  async getOverview(): Promise<AdminOverviewStats> {
    const [
      totalUsers,
      totalStudents,
      totalOwners,
      totalProperties,
      activeBookings,
      pendingReviews,
      pendingTrustAudits,
      paymentsAgg,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ role: UserRole.STUDENT }).exec(),
      this.userModel.countDocuments({ role: UserRole.OWNER }).exec(),
      this.propertyModel.countDocuments().exec(),
      this.bookingModel.countDocuments({ status: BookingStatus.CONFIRMED }).exec(),
      this.reviewModel.countDocuments({ status: ReviewStatus.PENDING }).exec(),
      this.trustPassportModel.countDocuments({ isFullyVerified: false }).exec(),
      this.paymentModel.aggregate([
        { $match: { status: PaymentStatus.SUCCESS } },
        { $group: { _id: null, totalVolume: { $sum: '$amount' } } },
      ]).exec(),
    ]);

    const grossTransactionVolume = paymentsAgg.length > 0 && paymentsAgg[0].totalVolume
      ? paymentsAgg[0].totalVolume
      : 0;

    return {
      totalUsers,
      totalStudents,
      totalOwners,
      totalProperties,
      activeBookings,
      grossTransactionVolume,
      pendingTrustAudits,
      pendingReviews,
    };
  }

  /**
   * Retrieves all properties with their 7-point Trust Passport audit status for administrative review
   */
  async getTrustAudits(): Promise<AdminTrustAuditItem[]> {
    const properties = await this.propertyModel
      .find()
      .populate<{ ownerId: { name: string; email: string; phone: string } }>('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();

    const auditItems: AdminTrustAuditItem[] = [];

    for (const prop of properties) {
      const passport = await this.trustService.getPassportByPropertyId(prop._id.toString());
      const owner = prop.ownerId as any;

      const verifiedCheckpoints = passport.checkpoints.filter(
        (c) => c.status === VerificationStatus.VERIFIED,
      ).length;

      auditItems.push({
        id: passport._id.toString(),
        propertyId: prop._id.toString(),
        propertyName: prop.name,
        slug: prop.slug,
        city: prop.address?.city || 'Unknown',
        ownerName: owner?.name || 'Owner',
        ownerEmail: owner?.email || '',
        ownerPhone: owner?.phone || '',
        isFullyVerified: passport.isFullyVerified,
        score: passport.score || verifiedCheckpoints,
        totalCheckpoints: passport.checkpoints.length,
        verifiedCheckpoints,
        lastVerifiedAt: passport.lastVerifiedAt
          ? new Date(passport.lastVerifiedAt).toISOString()
          : undefined,
        checkpoints: passport.checkpoints.map((cp) => ({
          type: cp.type,
          status: cp.status,
          verifiedAt: cp.verifiedAt ? new Date(cp.verifiedAt).toISOString() : undefined,
          notes: cp.notes,
        })),
      });
    }

    return auditItems;
  }

  async verifyTrustCheckpoint(
    propertyId: string,
    dto: VerifyCheckpointDto,
    auditorId?: string,
  ) {
    return this.trustService.verifyCheckpoint(propertyId, dto, auditorId);
  }

  async getAllReviews(): Promise<IReview[]> {
    return this.reviewsService.getAllReviews();
  }

  async moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<IReview> {
    return this.reviewsService.moderateReview(reviewId, dto);
  }

  async getAllUsers(role?: UserRole): Promise<UserDocument[]> {
    const query = role ? { role } : {};
    return this.userModel.find(query).select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 }).exec();
  }

  async getProperties(filter?: { status?: PropertyStatus; approvalStatus?: ApprovalStatus }): Promise<PropertyDocument[]> {
    const query: Record<string, unknown> = {};
    if (filter?.status) query.status = filter.status;
    if (filter?.approvalStatus) query.approvalStatus = filter.approvalStatus;

    return this.propertyModel
      .find(query)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async moderateProperty(propertyId: string, dto: ModerateEntityDto, adminId: string, ipAddress?: string): Promise<PropertyDocument> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID.');
    }

    const property = await this.propertyModel.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    const admin = await this.userModel.findById(adminId);
    const previousStatus = property.approvalStatus;
    property.approvalStatus = dto.status as ApprovalStatus;
    property.approvedBy = new Types.ObjectId(adminId);
    property.approvedAt = new Date();
    if (dto.reason) {
      property.approvalNotes = dto.reason;
    }

    if (dto.status === 'APPROVED') {
      property.status = PropertyStatus.ACTIVE;
    } else {
      property.status = PropertyStatus.INACTIVE;
    }

    if (dto.isPhysicallyVerified !== undefined) {
      property.isPhysicallyVerified = dto.isPhysicallyVerified;
    }

    await property.save();

    // Audit log
    await this.adminAuditLogModel.create({
      adminId: new Types.ObjectId(adminId),
      adminEmail: admin?.email || '',
      action: `PROPERTY_${dto.status}`,
      targetType: 'PROPERTY',
      targetId: property._id.toString(),
      reason: dto.reason || null,
      diff: {
        propertyName: property.name,
        previousApprovalStatus: previousStatus,
        newApprovalStatus: dto.status,
      },
      ipAddress: ipAddress || null,
    });

    this.logger.log(`Property ${property.name} approvalStatus set to ${dto.status} by admin ${adminId}`);
    return property;
  }

  async getMesses(filter?: { status?: string; approvalStatus?: ApprovalStatus }): Promise<MessDocument[]> {
    const query: Record<string, unknown> = {};
    if (filter?.status) query.status = filter.status;
    if (filter?.approvalStatus) query.approvalStatus = filter.approvalStatus;

    return this.messModel
      .find(query)
      .populate('partnerId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async moderateMess(messId: string, dto: ModerateEntityDto, adminId: string, ipAddress?: string): Promise<MessDocument> {
    if (!Types.ObjectId.isValid(messId)) {
      throw new BadRequestException('Invalid mess ID.');
    }

    const mess = await this.messModel.findById(messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

    const admin = await this.userModel.findById(adminId);
    const previousStatus = mess.approvalStatus;
    mess.approvalStatus = dto.status as ApprovalStatus;
    mess.approvedBy = new Types.ObjectId(adminId);
    mess.approvedAt = new Date();
    if (dto.reason) {
      mess.approvalNotes = dto.reason;
    }

    if (dto.status === 'APPROVED') {
      mess.status = 'ACTIVE';
    } else {
      mess.status = 'INACTIVE';
    }

    if (dto.isPhysicallyVerified !== undefined) {
      mess.isPhysicallyVerified = dto.isPhysicallyVerified;
    }

    await mess.save();

    // Audit log
    await this.adminAuditLogModel.create({
      adminId: new Types.ObjectId(adminId),
      adminEmail: admin?.email || '',
      action: `MESS_${dto.status}`,
      targetType: 'MESS',
      targetId: mess._id.toString(),
      reason: dto.reason || null,
      diff: {
        messName: mess.name,
        previousApprovalStatus: previousStatus,
        newApprovalStatus: dto.status,
      },
      ipAddress: ipAddress || null,
    });

    this.logger.log(`Mess ${mess.name} approvalStatus set to ${dto.status} by admin ${adminId}`);
    return mess;
  }

  async getAllMedia(filter?: { reviewStatus?: MediaReviewStatus }): Promise<MediaDocument[]> {
    const query: Record<string, unknown> = {};
    if (filter?.reviewStatus) query.reviewStatus = filter.reviewStatus;

    return this.mediaModel
      .find(query)
      .populate('uploaderId', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }
}
