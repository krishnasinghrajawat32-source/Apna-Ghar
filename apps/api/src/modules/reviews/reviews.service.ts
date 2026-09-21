import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, ReportReviewDto } from './reviews.dto';
import { BookingStatus, PropertyReviewSummaryDto } from '@apnaghar/shared-types';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a verified stay review.
   * Invariant: Only students with a completed or checked-in stay can review.
   * A booking can only be reviewed once.
   */
  async createReview(studentUserId: string, dto: CreateReviewDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        bed: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== student.id) {
      throw new ForbiddenException('You can only review bookings made by your account');
    }

    if (
      booking.status !== BookingStatus.COMPLETED &&
      booking.status !== BookingStatus.CHECKED_IN
    ) {
      throw new BadRequestException(
        'Reviews are strictly restricted to verified stays. Your booking must be CHECKED_IN or COMPLETED to leave a review.',
      );
    }

    // Check if review already exists for this booking
    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });
    if (existing) {
      throw new ConflictException('A review has already been submitted for this booking');
    }

    const propertyId = booking.bed.room.roomType.propertyId;

    // Execute in transaction: create review + update property average rating & count
    const review = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          studentId: student.id,
          propertyId,
          bookingId: dto.bookingId,
          overallRating: dto.overallRating,
          comment: dto.comment,
          isVerifiedStay: true,
          isApproved: true,
          categoryRatings: dto.categoryRatings && dto.categoryRatings.length > 0
            ? {
                create: dto.categoryRatings.map((cr) => ({
                  category: cr.category,
                  rating: cr.rating,
                })),
              }
            : undefined,
        },
        include: {
          categoryRatings: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Recalculate property ratings
      const allReviews = await tx.review.findMany({
        where: { propertyId, isApproved: true },
        select: { overallRating: true },
      });

      const totalCount = allReviews.length;
      const sumRatings = allReviews.reduce((acc, r) => acc + r.overallRating, 0);
      const newAverage = totalCount > 0 ? Number((sumRatings / totalCount).toFixed(2)) : 0;

      await tx.property.update({
        where: { id: propertyId },
        data: {
          averageRating: newAverage,
          reviewCount: totalCount,
        },
      });

      return createdReview;
    });

    return review;
  }

  /**
   * Public list of approved reviews for a property with aggregate breakdown
   */
  async getPropertyReviews(propertyId: string, page: number = 1, limit: number = 10) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const skip = (page - 1) * limit;

    const [reviews, totalCount, allReviews] = await Promise.all([
      this.prisma.review.findMany({
        where: { propertyId, isApproved: true },
        include: {
          categoryRatings: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { propertyId, isApproved: true },
      }),
      this.prisma.review.findMany({
        where: { propertyId, isApproved: true },
        include: {
          categoryRatings: true,
        },
      }),
    ]);

    // Compute breakdown summary
    const starDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const categoryTotals: Record<string, { sum: number; count: number }> = {};

    let totalRatingSum = 0;
    for (const r of allReviews) {
      totalRatingSum += r.overallRating;
      starDistribution[r.overallRating] = (starDistribution[r.overallRating] || 0) + 1;

      if (r.categoryRatings) {
        for (const cr of r.categoryRatings) {
          if (!categoryTotals[cr.category]) {
            categoryTotals[cr.category] = { sum: 0, count: 0 };
          }
          categoryTotals[cr.category].sum += cr.rating;
          categoryTotals[cr.category].count += 1;
        }
      }
    }

    const categoryAverages: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryTotals)) {
      categoryAverages[cat] = Number((data.sum / data.count).toFixed(1));
    }

    const summary: PropertyReviewSummaryDto = {
      averageRating: totalCount > 0 ? Number((totalRatingSum / totalCount).toFixed(2)) : 0,
      totalReviews: totalCount,
      categoryAverages,
      starDistribution,
    };

    return {
      reviews,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Report an inappropriate or fraudulent review
   */
  async reportReview(userId: string, reviewId: string, dto: ReportReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        entityType: 'REVIEW',
        entityId: reviewId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    return report;
  }

  /**
   * Admin moderation: Approve review
   */
  async adminApproveReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
    });
  }

  /**
   * Admin moderation: Delete review and recalculate property score
   */
  async adminDeleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const propertyId = review.propertyId;

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      });

      const remainingReviews = await tx.review.findMany({
        where: { propertyId, isApproved: true },
        select: { overallRating: true },
      });

      const count = remainingReviews.length;
      const sum = remainingReviews.reduce((acc, r) => acc + r.overallRating, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;

      await tx.property.update({
        where: { id: propertyId },
        data: {
          averageRating: avg,
          reviewCount: count,
        },
      });
    });

    return { message: 'Review deleted successfully' };
  }
}
