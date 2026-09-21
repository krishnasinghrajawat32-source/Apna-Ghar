import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { VerificationStatus } from '@apnaghar/shared-types';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submitVerification(
    ownerUserId: string,
    propertyId: string,
    dto: SubmitVerificationDto,
  ) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException('Owner profile not found.');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== owner.id) {
      throw new ForbiddenException('You do not have permission to submit verification for this property.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create verification submission record
      const verification = await tx.propertyVerification.create({
        data: {
          property: { connect: { id: propertyId } },
          documentType: dto.documentType,
          storageKey: dto.storageKey,
          status: 'PENDING',
        },
      });

      // 2. Transition property status to UNDER_REVIEW
      await tx.property.update({
        where: { id: propertyId },
        data: { status: 'UNDER_REVIEW' },
      });

      // 3. Log audit event
      await tx.auditLog.create({
        data: {
          actor: { connect: { id: ownerUserId } },
          action: 'PROPERTY_VERIFICATION_SUBMITTED',
          entityType: 'Property',
          entityId: propertyId,
          metadata: {
            verificationId: verification.id,
            documentType: dto.documentType,
          },
        },
      });

      return verification;
    });
  }

  async getPendingVerifications() {
    return this.prisma.propertyVerification.findMany({
      where: { status: 'PENDING' },
      include: {
        property: {
          include: {
            owner: true,
            address: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async reviewVerification(
    adminUserId: string,
    verificationId: string,
    dto: ReviewVerificationDto,
  ) {
    const verification = await this.prisma.propertyVerification.findUnique({
      where: { id: verificationId },
      include: { property: true },
    });

    if (!verification) {
      throw new NotFoundException('Verification submission not found.');
    }

    const isApproval = dto.status === VerificationStatus.VERIFIED;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update verification record
      const updatedVerification = await tx.propertyVerification.update({
        where: { id: verificationId },
        data: {
          status: dto.status as any,
          reviewedBy: adminUserId,
          reviewNotes: dto.reviewNotes,
          reviewedAt: new Date(),
        },
      });

      // 2. Update property status and verification flags
      await tx.property.update({
        where: { id: verification.propertyId },
        data: {
          isVerified: isApproval,
          status: isApproval ? 'ACTIVE' : 'REJECTED',
          verificationScore: isApproval ? dto.verificationScore || 100 : 0,
        },
      });

      // 3. Record audit trail
      await tx.auditLog.create({
        data: {
          actor: { connect: { id: adminUserId } },
          action: isApproval ? 'PROPERTY_VERIFIED' : 'PROPERTY_VERIFICATION_REJECTED',
          entityType: 'Property',
          entityId: verification.propertyId,
          metadata: {
            verificationId,
            status: dto.status,
            verificationScore: dto.verificationScore,
            reviewNotes: dto.reviewNotes,
          },
        },
      });

      return updatedVerification;
    });
  }
}
