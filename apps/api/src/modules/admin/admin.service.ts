import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserRole,
  UserStatus,
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
} from '@apna-ghar/shared-types';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { TrustPassport, TrustPassportDocument } from '../trust/schemas/trust-passport.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Mess, MessDocument } from '../mess/schemas/mess.schema';
import { Media, MediaDocument } from '@apna-ghar/database';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from '../reviews/reviews.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
import { ModerateEntityDto, ModerateUserDto } from './dto/moderate-entity.dto';

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
    private readonly trustService: TrustService,
    private readonly reviewsService: ReviewsService,
  ) {}

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

  /**
   * Updates/audits a specific Trust Passport checkpoint for a property
   */
  async verifyTrustCheckpoint(
    propertyId: string,
    dto: VerifyCheckpointDto,
    auditorId?: string,
  ) {
    return this.trustService.verifyCheckpoint(propertyId, dto, auditorId);
  }

  /**
   * Retrieves all reviews across platform for moderation
   */
  async getAllReviews(): Promise<IReview[]> {
    return this.reviewsService.getAllReviews();
  }

  /**
   * Moderates a review
   */
  async moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<IReview> {
    return this.reviewsService.moderateReview(reviewId, dto);
  }

  /**
   * List users across platform with optional role filter.
   */
  async getAllUsers(role?: UserRole): Promise<UserDocument[]> {
    const query = role ? { role } : {};
    return this.userModel.find(query).select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 }).exec();
  }

  /**
   * Admin approves, suspends, or updates status of a user account.
   */
  async moderateUser(userId: string, dto: ModerateUserDto, adminId: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.status = dto.status as UserStatus;
    await user.save();
    this.logger.log(`User ${user.email} status updated to ${dto.status} by admin ${adminId}`);
    return user;
  }

  /**
   * List properties with optional approval or operational status filter.
   */
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

  /**
   * Admin approves, rejects, or suspends a property listing.
   * If approved, status becomes ACTIVE.
   * Only marks physically verified if explicit authorized physical inspection occurred.
   */
  async moderateProperty(propertyId: string, dto: ModerateEntityDto, adminId: string): Promise<PropertyDocument> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID.');
    }

    const property = await this.propertyModel.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

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
    this.logger.log(`Property ${property.name} approvalStatus set to ${dto.status} by admin ${adminId}`);
    return property;
  }

  /**
   * List messes with optional approval or operational status filter.
   */
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

  /**
   * Admin approves, rejects, or suspends a food service / mess outlet.
   * If approved, status becomes ACTIVE.
   */
  async moderateMess(messId: string, dto: ModerateEntityDto, adminId: string): Promise<MessDocument> {
    if (!Types.ObjectId.isValid(messId)) {
      throw new BadRequestException('Invalid mess ID.');
    }

    const mess = await this.messModel.findById(messId);
    if (!mess) {
      throw new NotFoundException('Mess outlet not found.');
    }

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
    this.logger.log(`Mess ${mess.name} approvalStatus set to ${dto.status} by admin ${adminId}`);
    return mess;
  }

  /**
   * List all media uploads across the platform for admin moderation.
   */
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
