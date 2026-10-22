import { Model } from 'mongoose';
import { AdminOverviewStats, AdminTrustAuditItem, Review as IReview } from '@apna-ghar/shared-types';
import { UserDocument } from '../users/schemas/user.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { PaymentDocument } from '../payments/schemas/payment.schema';
import { TrustPassportDocument } from '../trust/schemas/trust-passport.schema';
import { ReviewDocument } from '../reviews/schemas/review.schema';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from '../reviews/reviews.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
export declare class AdminService {
    private readonly userModel;
    private readonly propertyModel;
    private readonly bookingModel;
    private readonly paymentModel;
    private readonly trustPassportModel;
    private readonly reviewModel;
    private readonly trustService;
    private readonly reviewsService;
    constructor(userModel: Model<UserDocument>, propertyModel: Model<PropertyDocument>, bookingModel: Model<BookingDocument>, paymentModel: Model<PaymentDocument>, trustPassportModel: Model<TrustPassportDocument>, reviewModel: Model<ReviewDocument>, trustService: TrustService, reviewsService: ReviewsService);
    /**
     * Aggregates platform-wide Key Performance Indicators
     */
    getOverview(): Promise<AdminOverviewStats>;
    /**
     * Retrieves all properties with their 7-point Trust Passport audit status for administrative review
     */
    getTrustAudits(): Promise<AdminTrustAuditItem[]>;
    /**
     * Updates/audits a specific Trust Passport checkpoint for a property
     */
    verifyTrustCheckpoint(propertyId: string, dto: VerifyCheckpointDto, auditorId?: string): Promise<TrustPassportDocument>;
    /**
     * Retrieves all reviews across platform for moderation
     */
    getAllReviews(): Promise<IReview[]>;
    /**
     * Moderates a review
     */
    moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<IReview>;
}
//# sourceMappingURL=admin.service.d.ts.map