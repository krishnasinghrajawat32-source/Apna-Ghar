import { TrustService } from './trust.service';
import { VerifyCheckpointDto } from './dto/verify-checkpoint.dto';
export declare class TrustController {
    private readonly trustService;
    constructor(trustService: TrustService);
    getPassport(propertyId: string): Promise<{
        success: boolean;
        data: import("./schemas/trust-passport.schema").TrustPassportDocument;
    }>;
    getPassportBySlug(slug: string): Promise<{
        success: boolean;
        data: import("./schemas/trust-passport.schema").TrustPassportDocument;
    }>;
    verifyCheckpoint(propertyId: string, dto: VerifyCheckpointDto, auditorId: string): Promise<{
        success: boolean;
        data: import("./schemas/trust-passport.schema").TrustPassportDocument;
    }>;
    confirmFreshness(propertyId: string): Promise<{
        success: boolean;
        data: {
            propertyId: string;
            lastAvailabilityUpdatedAt: Date;
            freshness: import("@apna-ghar/shared-types").AvailabilityFreshness;
        };
    }>;
}
//# sourceMappingURL=trust.controller.d.ts.map