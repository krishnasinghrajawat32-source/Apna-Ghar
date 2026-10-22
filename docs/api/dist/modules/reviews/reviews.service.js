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
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
const review_schema_1 = require("./schemas/review.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    reviewModel;
    propertyModel;
    bookingModel;
    logger = new common_1.Logger(ReviewsService_1.name);
    constructor(reviewModel, propertyModel, bookingModel) {
        this.reviewModel = reviewModel;
        this.propertyModel = propertyModel;
        this.bookingModel = bookingModel;
    }
    /**
     * Submits a verified resident review.
     * Lock 3 & 4 Enforced: Student MUST have a CONFIRMED or COMPLETED booking for the property.
     */
    async createReview(studentId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(studentId)) {
            throw new common_1.BadRequestException('Invalid student ID format.');
        }
        if (!mongoose_2.Types.ObjectId.isValid(dto.propertyId)) {
            throw new common_1.BadRequestException('Invalid property ID format.');
        }
        if (!mongoose_2.Types.ObjectId.isValid(dto.bookingId)) {
            throw new common_1.BadRequestException('Invalid booking ID format.');
        }
        // 1. Verify that the student has a genuine confirmed/completed booking for this property
        const booking = await this.bookingModel.findOne({
            _id: new mongoose_2.Types.ObjectId(dto.bookingId),
            studentId: new mongoose_2.Types.ObjectId(studentId),
            propertyId: new mongoose_2.Types.ObjectId(dto.propertyId),
            status: { $in: [shared_types_1.BookingStatus.CONFIRMED, shared_types_1.BookingStatus.COMPLETED] },
        }).exec();
        if (!booking) {
            throw new common_1.BadRequestException('Only verified resident students with confirmed or completed bookings can post reviews.');
        }
        // 2. Prevent duplicate reviews for the same booking
        const existingReview = await this.reviewModel.findOne({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            bookingId: new mongoose_2.Types.ObjectId(dto.bookingId),
        }).exec();
        if (existingReview) {
            throw new common_1.BadRequestException('You have already submitted a review for this booking.');
        }
        // 3. Create the verified review
        const created = await this.reviewModel.create({
            propertyId: new mongoose_2.Types.ObjectId(dto.propertyId),
            studentId: new mongoose_2.Types.ObjectId(studentId),
            bookingId: new mongoose_2.Types.ObjectId(dto.bookingId),
            rating: dto.rating,
            cleanlinessRating: dto.cleanlinessRating,
            foodRating: dto.foodRating,
            safetyRating: dto.safetyRating,
            comment: dto.comment.trim(),
            verifiedStay: true,
            status: shared_types_1.ReviewStatus.APPROVED,
        });
        // 4. Recalculate property overall ratings
        await this.recalculatePropertyRating(dto.propertyId);
        // 5. Populate student name for return
        const populated = await this.reviewModel
            .findById(created._id)
            .populate('studentId', 'name')
            .populate('propertyId', 'name slug')
            .exec();
        return this.mapToReviewInterface(populated || created);
    }
    /**
     * Public retrieval of approved verified reviews for a property
     */
    async getPropertyReviews(propertyId) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.BadRequestException('Invalid property ID format.');
        }
        const reviews = await this.reviewModel
            .find({
            propertyId: new mongoose_2.Types.ObjectId(propertyId),
            status: shared_types_1.ReviewStatus.APPROVED,
        })
            .populate('studentId', 'name')
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
    async getAllReviews() {
        const reviews = await this.reviewModel
            .find()
            .populate('studentId', 'name')
            .populate('propertyId', 'name slug')
            .sort({ createdAt: -1 })
            .exec();
        return reviews.map((r) => this.mapToReviewInterface(r));
    }
    /**
     * Retrieves pending reviews for admin moderation queue
     */
    async getPendingReviews() {
        const reviews = await this.reviewModel
            .find({ status: shared_types_1.ReviewStatus.PENDING })
            .populate('studentId', 'name')
            .populate('propertyId', 'name slug')
            .sort({ createdAt: -1 })
            .exec();
        return reviews.map((r) => this.mapToReviewInterface(r));
    }
    /**
     * Moderates a review (approve or reject)
     */
    async moderateReview(reviewId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(reviewId)) {
            throw new common_1.BadRequestException('Invalid review ID format.');
        }
        const review = await this.reviewModel
            .findByIdAndUpdate(reviewId, {
            status: dto.status,
            ...(dto.moderationNote ? { moderationNote: dto.moderationNote } : {}),
        }, { new: true })
            .populate('studentId', 'name')
            .populate('propertyId', 'name slug')
            .exec();
        if (!review) {
            throw new common_1.NotFoundException(`Review with ID "${reviewId}" not found.`);
        }
        // Recalculate property ratings when moderation status changes
        await this.recalculatePropertyRating(review.propertyId.toString());
        return this.mapToReviewInterface(review);
    }
    /**
     * Recalculates average ratings and count for a property
     */
    async recalculatePropertyRating(propertyId) {
        const propId = new mongoose_2.Types.ObjectId(propertyId);
        const approvedReviews = await this.reviewModel
            .find({ propertyId: propId, status: shared_types_1.ReviewStatus.APPROVED })
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
    calculateBreakdown(reviews) {
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
            const star = Math.min(Math.max(Math.round(r.rating), 1), 5);
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
    mapToReviewInterface(doc) {
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
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __param(1, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(2, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map