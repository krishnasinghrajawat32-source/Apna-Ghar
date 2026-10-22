import { AdminService } from './admin.service';
import { VerifyCheckpointDto } from '../trust/dto/verify-checkpoint.dto';
import { ModerateReviewDto } from '../reviews/dto/moderate-review.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getOverview(): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").AdminOverviewStats;
    }>;
    getTrustAudits(): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").AdminTrustAuditItem[];
    }>;
    verifyTrustCheckpoint(propertyId: string, dto: VerifyCheckpointDto, auditorId: string): Promise<{
        success: boolean;
        data: import("../trust/schemas/trust-passport.schema").TrustPassportDocument;
    }>;
    getAllReviews(): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").Review[];
    }>;
    moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<{
        success: boolean;
        data: import("@apna-ghar/shared-types").Review;
    }>;
}
//# sourceMappingURL=admin.controller.d.ts.map