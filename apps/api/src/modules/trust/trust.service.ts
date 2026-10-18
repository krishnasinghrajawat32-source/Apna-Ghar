import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TrustPassport,
  TrustPassportDocument,
  CheckpointItem,
} from './schemas/trust-passport.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import {
  VerificationType,
  VerificationStatus,
  AvailabilityFreshness,
} from '@apna-ghar/shared-types';
import { FRESHNESS_THRESHOLDS } from '@apna-ghar/shared-constants';
import { VerifyCheckpointDto } from './dto/verify-checkpoint.dto';

const ALL_CHECKPOINTS: VerificationType[] = [
  VerificationType.OWNER_IDENTITY,
  VerificationType.LOCATION,
  VerificationType.PHOTOS,
  VerificationType.PRICING,
  VerificationType.AMENITIES,
  VerificationType.INVENTORY,
  VerificationType.DOCUMENTS,
];

@Injectable()
export class TrustService implements OnModuleInit {
  private readonly logger = new Logger(TrustService.name);

  constructor(
    @InjectModel(TrustPassport.name)
    private readonly trustPassportModel: Model<TrustPassportDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialPassports();
  }

  /**
   * Generates default blank 7 checkpoints if none exist
   */
  private buildDefaultCheckpoints(): CheckpointItem[] {
    return ALL_CHECKPOINTS.map((type) => ({
      type,
      status: VerificationStatus.PENDING,
      notes: 'Audit pending initial verification',
    }));
  }

  /**
   * Retrieves or creates a Trust Passport for a property
   */
  async getPassportByPropertyId(propertyId: string): Promise<TrustPassportDocument> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new NotFoundException(`Invalid property ID: ${propertyId}`);
    }

    let passport = await this.trustPassportModel.findOne({
      propertyId: new Types.ObjectId(propertyId),
    }).exec();

    if (!passport) {
      passport = await this.trustPassportModel.create({
        propertyId: new Types.ObjectId(propertyId),
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
  async getPassportByPropertySlug(slug: string): Promise<TrustPassportDocument> {
    const property = await this.propertyModel.findOne({ slug }).exec();
    if (!property) {
      throw new NotFoundException(`Property with slug "${slug}" not found`);
    }
    return this.getPassportByPropertyId(property._id.toString());
  }

  /**
   * Verifies or rejects a specific checkpoint
   */
  async verifyCheckpoint(
    propertyId: string,
    dto: VerifyCheckpointDto,
    auditorId?: string,
  ): Promise<TrustPassportDocument> {
    const passport = await this.getPassportByPropertyId(propertyId);

    const checkpointIndex = passport.checkpoints.findIndex((cp) => cp.type === dto.type);

    const updatedCheckpoint: CheckpointItem = {
      type: dto.type,
      status: dto.status,
      verifiedAt: dto.status === VerificationStatus.VERIFIED ? new Date() : undefined,
      notes: dto.notes || '',
      verifiedBy: auditorId && Types.ObjectId.isValid(auditorId)
        ? new Types.ObjectId(auditorId)
        : undefined,
    };

    if (checkpointIndex >= 0) {
      passport.checkpoints[checkpointIndex] = updatedCheckpoint;
    } else {
      passport.checkpoints.push(updatedCheckpoint);
    }

    // Calculate score
    const verifiedCount = passport.checkpoints.filter(
      (cp) => cp.status === VerificationStatus.VERIFIED,
    ).length;

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
  calculateFreshness(lastUpdatedAt?: Date | string): AvailabilityFreshness {
    if (!lastUpdatedAt) {
      return AvailabilityFreshness.STALE;
    }

    const updatedTime = new Date(lastUpdatedAt).getTime();
    const diffHours = (Date.now() - updatedTime) / (1000 * 60 * 60);

    if (diffHours <= FRESHNESS_THRESHOLDS.FRESH_HOURS) {
      return AvailabilityFreshness.FRESH;
    }
    if (diffHours <= FRESHNESS_THRESHOLDS.NEEDS_CONFIRMATION_HOURS) {
      return AvailabilityFreshness.NEEDS_CONFIRMATION;
    }
    return AvailabilityFreshness.STALE;
  }

  /**
   * Confirms current bed availability and refreshes timestamp to now()
   */
  async confirmAvailabilityFreshness(propertyId: string): Promise<{
    propertyId: string;
    lastAvailabilityUpdatedAt: Date;
    freshness: AvailabilityFreshness;
  }> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new NotFoundException(`Invalid property ID: ${propertyId}`);
    }

    const now = new Date();
    const property = await this.propertyModel.findByIdAndUpdate(
      propertyId,
      { lastAvailabilityUpdatedAt: now },
      { new: true },
    ).exec();

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    return {
      propertyId,
      lastAvailabilityUpdatedAt: now,
      freshness: AvailabilityFreshness.FRESH,
    };
  }

  /**
   * Seeds initial verified passports for seeded properties
   */
  private async seedInitialPassports(): Promise<void> {
    const properties = await this.propertyModel.find().exec();
    for (const prop of properties) {
      const existing = await this.trustPassportModel.findOne({ propertyId: prop._id }).exec();
      if (!existing) {
        const checkpoints: CheckpointItem[] = [
          {
            type: VerificationType.OWNER_IDENTITY,
            status: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            notes: 'Aadhaar and PAN KYC audited and matched with land records',
          },
          {
            type: VerificationType.LOCATION,
            status: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            notes: 'Physical on-site GPS coordinates validated within 5m accuracy',
          },
          {
            type: VerificationType.PHOTOS,
            status: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            notes: 'All 8 uploaded property photos cross-referenced with live rooms',
          },
          {
            type: VerificationType.PRICING,
            status: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            notes: 'Rent agreement terms verified: zero hidden brokerage or surcharges',
          },
          {
            type: VerificationType.AMENITIES,
            status: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            notes: 'High-speed Wi-Fi (150 Mbps), power backup, and geysers verified functional',
          },
          {
            type: VerificationType.INVENTORY,
            status: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            notes: 'Physical bed and room count matches database records exactly',
          },
          {
            type: VerificationType.DOCUMENTS,
            status: VerificationStatus.VERIFIED,
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
}
