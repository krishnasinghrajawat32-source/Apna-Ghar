import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { TrustPassportDocument } from './schemas/trust-passport.schema';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { AvailabilityFreshness } from '@apna-ghar/shared-types';
import { VerifyCheckpointDto } from './dto/verify-checkpoint.dto';
export declare class TrustService implements OnModuleInit {
    private readonly trustPassportModel;
    private readonly propertyModel;
    private readonly logger;
    constructor(trustPassportModel: Model<TrustPassportDocument>, propertyModel: Model<PropertyDocument>);
    onModuleInit(): Promise<void>;
    /**
     * Generates default blank 7 checkpoints if none exist
     */
    private buildDefaultCheckpoints;
    /**
     * Retrieves or creates a Trust Passport for a property
     */
    getPassportByPropertyId(propertyId: string): Promise<TrustPassportDocument>;
    /**
     * Retrieves Trust Passport by property slug
     */
    getPassportByPropertySlug(slug: string): Promise<TrustPassportDocument>;
    /**
     * Verifies or rejects a specific checkpoint
     */
    verifyCheckpoint(propertyId: string, dto: VerifyCheckpointDto, auditorId?: string): Promise<TrustPassportDocument>;
    /**
     * Computes freshness status based on timestamp
     */
    calculateFreshness(lastUpdatedAt?: Date | string): AvailabilityFreshness;
    /**
     * Confirms current bed availability and refreshes timestamp to now()
     */
    confirmAvailabilityFreshness(propertyId: string): Promise<{
        propertyId: string;
        lastAvailabilityUpdatedAt: Date;
        freshness: AvailabilityFreshness;
    }>;
    /**
     * Seeds initial verified passports for seeded properties
     */
    private seedInitialPassports;
}
//# sourceMappingURL=trust.service.d.ts.map