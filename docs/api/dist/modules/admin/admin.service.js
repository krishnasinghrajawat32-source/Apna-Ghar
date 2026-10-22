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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
const user_schema_1 = require("../users/schemas/user.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const trust_passport_schema_1 = require("../trust/schemas/trust-passport.schema");
const review_schema_1 = require("../reviews/schemas/review.schema");
const trust_service_1 = require("../trust/trust.service");
const reviews_service_1 = require("../reviews/reviews.service");
let AdminService = class AdminService {
    userModel;
    propertyModel;
    bookingModel;
    paymentModel;
    trustPassportModel;
    reviewModel;
    trustService;
    reviewsService;
    constructor(userModel, propertyModel, bookingModel, paymentModel, trustPassportModel, reviewModel, trustService, reviewsService) {
        this.userModel = userModel;
        this.propertyModel = propertyModel;
        this.bookingModel = bookingModel;
        this.paymentModel = paymentModel;
        this.trustPassportModel = trustPassportModel;
        this.reviewModel = reviewModel;
        this.trustService = trustService;
        this.reviewsService = reviewsService;
    }
    /**
     * Aggregates platform-wide Key Performance Indicators
     */
    async getOverview() {
        const [totalUsers, totalStudents, totalOwners, totalProperties, activeBookings, pendingReviews, pendingTrustAudits, paymentsAgg,] = await Promise.all([
            this.userModel.countDocuments().exec(),
            this.userModel.countDocuments({ role: shared_types_1.UserRole.STUDENT }).exec(),
            this.userModel.countDocuments({ role: shared_types_1.UserRole.OWNER }).exec(),
            this.propertyModel.countDocuments().exec(),
            this.bookingModel.countDocuments({ status: shared_types_1.BookingStatus.CONFIRMED }).exec(),
            this.reviewModel.countDocuments({ status: shared_types_1.ReviewStatus.PENDING }).exec(),
            this.trustPassportModel.countDocuments({ isFullyVerified: false }).exec(),
            this.paymentModel.aggregate([
                { $match: { status: shared_types_1.PaymentStatus.SUCCESS } },
                { $group: { _id: null, totalVolume: { $sum: '$amount' } } },
            ]).exec(),
        ]);
        const grossTransactionVolume = paymentsAgg.length > 0 && paymentsAgg[0].totalVolume
            ? paymentsAgg[0].totalVolume
            : 0;
        return {
            totalUsers,
            totalStudents,
            totalOwners,
            totalProperties,
            activeBookings,
            grossTransactionVolume,
            pendingTrustAudits,
            pendingReviews,
        };
    }
    /**
     * Retrieves all properties with their 7-point Trust Passport audit status for administrative review
     */
    async getTrustAudits() {
        const properties = await this.propertyModel
            .find()
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 })
            .exec();
        const auditItems = [];
        for (const prop of properties) {
            const passport = await this.trustService.getPassportByPropertyId(prop._id.toString());
            const owner = prop.ownerId;
            const verifiedCheckpoints = passport.checkpoints.filter((c) => c.status === shared_types_1.VerificationStatus.VERIFIED).length;
            auditItems.push({
                id: passport._id.toString(),
                propertyId: prop._id.toString(),
                propertyName: prop.name,
                slug: prop.slug,
                city: prop.address?.city || 'Unknown',
                ownerName: owner?.name || 'Owner',
                ownerEmail: owner?.email || '',
                ownerPhone: owner?.phone || '',
                isFullyVerified: passport.isFullyVerified,
                score: passport.score || verifiedCheckpoints,
                totalCheckpoints: passport.checkpoints.length,
                verifiedCheckpoints,
                lastVerifiedAt: passport.lastVerifiedAt
                    ? new Date(passport.lastVerifiedAt).toISOString()
                    : undefined,
                checkpoints: passport.checkpoints.map((cp) => ({
                    type: cp.type,
                    status: cp.status,
                    verifiedAt: cp.verifiedAt ? new Date(cp.verifiedAt).toISOString() : undefined,
                    notes: cp.notes,
                })),
            });
        }
        return auditItems;
    }
    /**
     * Updates/audits a specific Trust Passport checkpoint for a property
     */
    async verifyTrustCheckpoint(propertyId, dto, auditorId) {
        return this.trustService.verifyCheckpoint(propertyId, dto, auditorId);
    }
    /**
     * Retrieves all reviews across platform for moderation
     */
    async getAllReviews() {
        return this.reviewsService.getAllReviews();
    }
    /**
     * Moderates a review
     */
    async moderateReview(reviewId, dto) {
        return this.reviewsService.moderateReview(reviewId, dto);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(2, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(3, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(4, (0, mongoose_1.InjectModel)(trust_passport_schema_1.TrustPassport.name)),
    __param(5, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        trust_service_1.TrustService,
        reviews_service_1.ReviewsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map