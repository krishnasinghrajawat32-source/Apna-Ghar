import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserRole,
  BookingStatus,
  PaymentStatus,
  ReviewStatus,
  AdminOverviewStats,
  AdminTrustAuditItem,
  Review as IReview,
  VerificationStatus,
} from '@apna-ghar/shared-types';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { TrustPassport, TrustPassportDocument } from '../trust/schemas/trust-passport.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from '../reviews/reviews.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';

@Injectable()
export class AdminService {

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(TrustPassport.name) private readonly trustPassportModel: Model<TrustPassportDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
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
}
