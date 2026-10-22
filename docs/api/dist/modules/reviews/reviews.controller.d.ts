import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createReview(studentId: string, dto: CreateReviewDto): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").Review;
    }>;
    getPropertyReviews(propertyId: string): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").PropertyReviewsResponse;
    }>;
    getAllReviews(): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").Review[];
    }>;
    getPendingReviews(): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").Review[];
    }>;
    moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").Review;
    }>;
}
//# sourceMappingURL=reviews.controller.d.ts.map