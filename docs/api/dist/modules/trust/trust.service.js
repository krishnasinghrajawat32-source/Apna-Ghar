"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TrustService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trust_passport_schema_1 = require("./schemas/trust-passport.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
const shared_constants_1 = require("@apna-ghar/shared-constants");
const ALL_CHECKPOINTS = [
    shared_types_1.VerificationType.OWNER_IDENTITY,
    shared_types_1.VerificationType.LOCATION,
    shared_types_1.VerificationType.PHOTOS,
    shared_types_1.VerificationType.PRICING,
    shared_types_1.VerificationType.AMENITIES,
    shared_types_1.VerificationType.INVENTORY,
    shared_types_1.VerificationType.DOCUMENTS,
];
let TrustService = TrustService_1 = class TrustService {
    trustPassportModel;
    propertyModel;
    logger = new common_1.Logger(TrustService_1.name);
    constructor(trustPassportModel, propertyModel) {
        this.trustPassportModel = trustPassportModel;
        this.propertyModel = propertyModel;
    }
    async onModuleInit() {
        const isConnected = !this.trustPassportModel.db || this.trustPassportModel.db.readyState === 1;
        if (isConnected) {
            await this.seedInitialPassports();
        }
        else {
            this.trustPassportModel.db.once('connected', () => {
                this.seedInitialPassports().catch((err) => {
                    this.logger.warn(`Trust passport seeding skipped or deferred: ${err.message}`);
                });
            });
        }
    }
    /**
     * Generates default blank 7 checkpoints if none exist
     */
    buildDefaultCheckpoints() {
        return ALL_CHECKPOINTS.map((type) => ({
            type,
            status: shared_types_1.VerificationStatus.PENDING,
            notes: 'Audit pending initial verification',
        }));
    }
    /**
     * Retrieves or creates a Trust Passport for a property
     */
    async getPassportByPropertyId(propertyId) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.NotFoundException(`Invalid property ID: ${propertyId}`);
        }
        let passport = await this.trustPassportModel.findOne({
            propertyId: new mongoose_2.Types.ObjectId(propertyId),
        }).exec();
        if (!passport) {
            passport = await this.trustPassportModel.create({
                propertyId: new mongoose_2.Types.ObjectId(propertyId),
                isFullyVerified: false,
                score: 0,
                checkpoints: this.buildDefaultCheckpoints(),
            });
        }
        return passport;
    }
    /**
     * Retrieves Trust Passport by property slug
     */
    async getPassportByPropertySlug(slug) {
        const property = await this.propertyModel.findOne({ slug }).exec();
        if (!property) {
            throw new common_1.NotFoundException(`Property with slug "${slug}" not found`);
        }
        return this.getPassportByPropertyId(property._id.toString());
    }
    /**
     * Verifies or rejects a specific checkpoint
     */
    async verifyCheckpoint(propertyId, dto, auditorId) {
        const passport = await this.getPassportByPropertyId(propertyId);
        const checkpointIndex = passport.checkpoints.findIndex((cp) => cp.type === dto.type);
        const updatedCheckpoint = {
            type: dto.type,
            status: dto.status,
            verifiedAt: dto.status === shared_types_1.VerificationStatus.VERIFIED ? new Date() : undefined,
            notes: dto.notes || '',
            verifiedBy: auditorId && mongoose_2.Types.ObjectId.isValid(auditorId)
                ? new mongoose_2.Types.ObjectId(auditorId)
                : undefined,
        };
        if (checkpointIndex >= 0) {
            passport.checkpoints[checkpointIndex] = updatedCheckpoint;
        }
        else {
            passport.checkpoints.push(updatedCheckpoint);
        }
        // Calculate score
        const verifiedCount = passport.checkpoints.filter((cp) => cp.status === shared_types_1.VerificationStatus.VERIFIED).length;
        passport.score = verifiedCount;
        passport.isFullyVerified = verifiedCount === ALL_CHECKPOINTS.length;
        if (passport.isFullyVerified) {
            passport.lastVerifiedAt = new Date();
        }
        await passport.save();
        // Synchronize isFullyVerified flag to Property document
        await this.propertyModel.findByIdAndUpdate(propertyId, {
            isFullyVerified: passport.isFullyVerified,
        }).exec();
        return passport;
    }
    /**
     * Computes freshness status based on timestamp
     */
    calculateFreshness(lastUpdatedAt) {
        if (!lastUpdatedAt) {
            return shared_types_1.AvailabilityFreshness.STALE;
        }
        const updatedTime = new Date(lastUpdatedAt).getTime();
        const diffHours = (Date.now() - updatedTime) / (1000 * 60 * 60);
        if (diffHours <= shared_constants_1.FRESHNESS_THRESHOLDS.FRESH_HOURS) {
            return shared_types_1.AvailabilityFreshness.FRESH;
        }
        if (diffHours <= shared_constants_1.FRESHNESS_THRESHOLDS.NEEDS_CONFIRMATION_HOURS) {
            return shared_types_1.AvailabilityFreshness.NEEDS_CONFIRMATION;
        }
        return shared_types_1.AvailabilityFreshness.STALE;
    }
    /**
     * Confirms current bed availability and refreshes timestamp to now()
     */
    async confirmAvailabilityFreshness(propertyId) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.NotFoundException(`Invalid property ID: ${propertyId}`);
        }
        const now = new Date();
        const property = await this.propertyModel.findByIdAndUpdate(propertyId, { lastAvailabilityUpdatedAt: now }, { new: true }).exec();
        if (!property) {
            throw new common_1.NotFoundException(`Property with ID ${propertyId} not found`);
        }
        return {
            propertyId,
            lastAvailabilityUpdatedAt: now,
            freshness: shared_types_1.AvailabilityFreshness.FRESH,
        };
    }
    /**
     * Seeds initial verified passports for seeded properties
     */
    async seedInitialPassports() {
        try {
            const properties = await this.propertyModel.find().exec();
            for (const prop of properties) {
                const existing = await this.trustPassportModel.findOne({ propertyId: prop._id }).exec();
                if (!existing) {
                    const checkpoints = [
                        {
                            type: shared_types_1.VerificationType.OWNER_IDENTITY,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'Aadhaar and PAN KYC audited and matched with land records',
                        },
                        {
                            type: shared_types_1.VerificationType.LOCATION,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'Physical on-site GPS coordinates validated within 5m accuracy',
                        },
                        {
                            type: shared_types_1.VerificationType.PHOTOS,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'All 8 uploaded property photos cross-referenced with live rooms',
                        },
                        {
                            type: shared_types_1.VerificationType.PRICING,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'Rent agreement terms verified: zero hidden brokerage or surcharges',
                        },
                        {
                            type: shared_types_1.VerificationType.AMENITIES,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'High-speed Wi-Fi (150 Mbps), power backup, and geysers verified functional',
                        },
                        {
                            type: shared_types_1.VerificationType.INVENTORY,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'Physical bed and room count matches database records exactly',
                        },
                        {
                            type: shared_types_1.VerificationType.DOCUMENTS,
                            status: shared_types_1.VerificationStatus.VERIFIED,
                            verifiedAt: new Date(),
                            notes: 'Police verification compliance and standard student lease verified',
                        },
                    ];
                    await this.trustPassportModel.create({
                        propertyId: prop._id,
                        isFullyVerified: true,
                        score: 7,
                        lastVerifiedAt: new Date(),
                        checkpoints,
                    });
                    // Ensure property has isFullyVerified set
                    await this.propertyModel.findByIdAndUpdate(prop._id, {
                        isFullyVerified: true,
                    }).exec();
                    this.logger.log(`Created 7-point verified Trust Passport for ${prop.name}`);
                }
            }
        }
        catch (err) {
            this.logger.warn(`Initial trust passport seeding skipped or deferred: ${err.message}`);
        }
    }
};
exports.TrustService = TrustService;
exports.TrustService = TrustService = TrustService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trust_passport_schema_1.TrustPassport.name)),
    __param(1, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], TrustService);
//# sourceMappingURL=trust.service.js.map