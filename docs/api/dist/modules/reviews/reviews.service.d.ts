import { Model } from 'mongoose';
import { Review as IReview, PropertyReviewsResponse } from '@apna-ghar/shared-types';
import { ReviewDocument } from './schemas/review.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
export declare class ReviewsService {
    private readonly reviewModel;
    private readonly propertyModel;
    private readonly bookingModel;
    private readonly logger;
    constructor(reviewModel: Model<ReviewDocument>, propertyModel: Model<PropertyDocument>, bookingModel: Model<BookingDocument>);
    /**
     * Submits a verified resident review.
     * Lock 3 & 4 Enforced: Student MUST have a CONFIRMED or COMPLETED booking for the property.
     */
    createReview(studentId: string, dto: CreateReviewDto): Promise<IReview>;
    /**
     * Public retrieval of approved verified reviews for a property
     */
    getPropertyReviews(propertyId: string): Promise<PropertyReviewsResponse>;
    /**
     * Retrieves all reviews across platform for admin management
     */
    getAllReviews(): Promise<IReview[]>;
    /**
     * Retrieves pending reviews for admin moderation queue
     */
    getPendingReviews(): Promise<IReview[]>;
    /**
     * Moderates a review (approve or reject)
     */
    moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<IReview>;
    /**
     * Recalculates average ratings and count for a property
     */
    recalculatePropertyRating(propertyId: string): Promise<void>;
    /**
     * Computes ratings breakdown and star distribution
     */
    private calculateBreakdown;
    /**
     * Helper to map document to IReview
     */
    private mapToReviewInterface;
}
//# sourceMappingURL=reviews.service.d.ts.map