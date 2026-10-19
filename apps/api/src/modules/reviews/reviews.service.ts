import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ReviewStatus,
  BookingStatus,
  Review as IReview,
  PropertyReviewsResponse,
  ReviewRatingsBreakdown,
} from '@apna-ghar/shared-types';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Submits a verified resident review.
   * Lock 3 & 4 Enforced: Student MUST have a CONFIRMED or COMPLETED booking for the property.
   */
  async createReview(studentId: string, dto: CreateReviewDto): Promise<IReview> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID format.');
    }
    if (!Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }
    if (!Types.ObjectId.isValid(dto.bookingId)) {
      throw new BadRequestException('Invalid booking ID format.');
    }

    // 1. Verify that the student has a genuine confirmed/completed booking for this property
    const booking = await this.bookingModel.findOne({
      _id: new Types.ObjectId(dto.bookingId),
      studentId: new Types.ObjectId(studentId),
      propertyId: new Types.ObjectId(dto.propertyId),
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    }).exec();

    if (!booking) {
      throw new BadRequestException(
        'Only verified resident students with confirmed or completed bookings can post reviews.',
      );
    }

    // 2. Prevent duplicate reviews for the same booking
    const existingReview = await this.reviewModel.findOne({
      studentId: new Types.ObjectId(studentId),
      bookingId: new Types.ObjectId(dto.bookingId),
    }).exec();

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this booking.');
    }

    // 3. Create the verified review
    const created = await this.reviewModel.create({
      propertyId: new Types.ObjectId(dto.propertyId),
      studentId: new Types.ObjectId(studentId),
      bookingId: new Types.ObjectId(dto.bookingId),
      rating: dto.rating,
      cleanlinessRating: dto.cleanlinessRating,
      foodRating: dto.foodRating,
      safetyRating: dto.safetyRating,
      comment: dto.comment.trim(),
      verifiedStay: true,
      status: ReviewStatus.APPROVED,
    });

    // 4. Recalculate property overall ratings
    await this.recalculatePropertyRating(dto.propertyId);

    // 5. Populate student name for return
    const populated = await this.reviewModel
      .findById(created._id)
      .populate<{ studentId: { name: string } }>('studentId', 'name')
      .populate<{ propertyId: { name: string; slug: string } }>('propertyId', 'name slug')
      .exec();

    return this.mapToReviewInterface(populated || created);
  }

  /**
   * Public retrieval of approved verified reviews for a property
   */
  async getPropertyReviews(propertyId: string): Promise<PropertyReviewsResponse> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Invalid property ID format.');
    }

    const reviews = await this.reviewModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        status: ReviewStatus.APPROVED,
      })
      .populate<{ studentId: { name: string } }>('studentId', 'name')
      .sort({ createdAt: -1 })
      .exec();

    const breakdown = this.calculateBreakdown(reviews);
    const mappedReviews = reviews.map((r) => this.mapToReviewInterface(r));

    return {
      breakdown,
      reviews: mappedReviews,
    };
  }

  /**
   * Retrieves all reviews across platform for admin management
   */
  async getAllReviews(): Promise<IReview[]> {
    const reviews = await this.reviewModel
      .find()
      .populate<{ studentId: { name: string } }>('studentId', 'name')
      .populate<{ propertyId: { name: string; slug: string } }>('propertyId', 'name slug')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((r) => this.mapToReviewInterface(r));
  }

  /**
   * Retrieves pending reviews for admin moderation queue
   */
  async getPendingReviews(): Promise<IReview[]> {
    const reviews = await this.reviewModel
      .find({ status: ReviewStatus.PENDING })
      .populate<{ studentId: { name: string } }>('studentId', 'name')
      .populate<{ propertyId: { name: string; slug: string } }>('propertyId', 'name slug')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((r) => this.mapToReviewInterface(r));
  }

  /**
   * Moderates a review (approve or reject)
   */
  async moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<IReview> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestException('Invalid review ID format.');
    }

    const review = await this.reviewModel
      .findByIdAndUpdate(
        reviewId,
        {
          status: dto.status,
          ...(dto.moderationNote ? { moderationNote: dto.moderationNote } : {}),
        },
        { new: true },
      )
      .populate<{ studentId: { name: string } }>('studentId', 'name')
      .populate<{ propertyId: { name: string; slug: string } }>('propertyId', 'name slug')
      .exec();

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found.`);
    }

    // Recalculate property ratings when moderation status changes
    await this.recalculatePropertyRating(review.propertyId.toString());

    return this.mapToReviewInterface(review);
  }

  /**
   * Recalculates average ratings and count for a property
   */
  async recalculatePropertyRating(propertyId: string): Promise<void> {
    const propId = new Types.ObjectId(propertyId);
    const approvedReviews = await this.reviewModel
      .find({ propertyId: propId, status: ReviewStatus.APPROVED })
      .select('rating')
      .exec();

    const count = approvedReviews.length;
    let avg = 0;
    if (count > 0) {
      const sum = approvedReviews.reduce((acc, curr) => acc + curr.rating, 0);
      avg = Number((sum / count).toFixed(1));
    }

    await this.propertyModel.findByIdAndUpdate(propId, {
      rating: avg,
      reviewCount: count,
    }).exec();

    this.logger.log(`Updated Property ${propertyId} rating: ${avg} (${count} reviews)`);
  }

  /**
   * Computes ratings breakdown and star distribution
   */
  private calculateBreakdown(
    reviews: Array<{ rating: number; cleanlinessRating: number; foodRating: number; safetyRating: number }>,
  ): ReviewRatingsBreakdown {
    const total = reviews.length;
    if (total === 0) {
      return {
        averageOverall: 0,
        averageCleanliness: 0,
        averageFood: 0,
        averageSafety: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    let sumOverall = 0;
    let sumCleanliness = 0;
    let sumFood = 0;
    let sumSafety = 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const r of reviews) {
      sumOverall += r.rating;
      sumCleanliness += r.cleanlinessRating;
      sumFood += r.foodRating;
      sumSafety += r.safetyRating;

      const star = Math.min(Math.max(Math.round(r.rating), 1), 5) as 1 | 2 | 3 | 4 | 5;
      distribution[star] = (distribution[star] || 0) + 1;
    }

    return {
      averageOverall: Number((sumOverall / total).toFixed(1)),
      averageCleanliness: Number((sumCleanliness / total).toFixed(1)),
      averageFood: Number((sumFood / total).toFixed(1)),
      averageSafety: Number((sumSafety / total).toFixed(1)),
      totalReviews: total,
      distribution,
    };
  }

  /**
   * Helper to map document to IReview
   */
  private mapToReviewInterface(doc: any): IReview {
    const student = doc.studentId;
    const property = doc.propertyId;

    return {
      id: doc._id?.toString() || doc.id || '',
      propertyId: property?._id?.toString() || property?.toString() || '',
      studentId: student?._id?.toString() || student?.toString() || '',
      bookingId: doc.bookingId?.toString() || '',
      rating: doc.rating,
      cleanlinessRating: doc.cleanlinessRating,
      foodRating: doc.foodRating,
      safetyRating: doc.safetyRating,
      comment: doc.comment,
      verifiedStay: doc.verifiedStay,
      status: doc.status,
      studentName: typeof student === 'object' && student?.name ? student.name : 'Verified Resident',
      propertyName: typeof property === 'object' && property?.name ? property.name : undefined,
      propertySlug: typeof property === 'object' && property?.slug ? property.slug : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
