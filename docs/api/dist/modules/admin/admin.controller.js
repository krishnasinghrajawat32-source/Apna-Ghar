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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_types_1 = require("@apna-ghar/shared-types");
const admin_service_1 = require("./admin.service");
const verify_checkpoint_dto_1 = require("../trust/dto/verify-checkpoint.dto");
const moderate_review_dto_1 = require("../reviews/dto/moderate-review.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getOverview() {
        const stats = await this.adminService.getOverview();
        return {
            success: true,
            data: stats,
        };
    }
    async getTrustAudits() {
        const audits = await this.adminService.getTrustAudits();
        return {
            success: true,
            data: audits,
        };
    }
    async verifyTrustCheckpoint(propertyId, dto, auditorId) {
        const updated = await this.adminService.verifyTrustCheckpoint(propertyId, dto, auditorId);
        return {
            success: true,
            data: updated,
        };
    }
    async getAllReviews() {
        const reviews = await this.adminService.getAllReviews();
        return {
            success: true,
            data: reviews,
        };
    }
    async moderateReview(reviewId, dto) {
        const review = await this.adminService.moderateReview(reviewId, dto);
        return {
            success: true,
            data: review,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform-wide operational KPIs and aggregate stats' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Platform overview statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('trust-audits'),
    (0, swagger_1.ApiOperation)({ summary: 'Get 7-point Trust Passport audit status for all properties' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of properties with audit status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTrustAudits", null);
__decorate([
    (0, common_1.Patch)('trust-audits/:propertyId/checkpoint'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Audit (verify/reject) a specific Trust Passport checkpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated Trust Passport' }),
    __param(0, (0, common_1.Param)('propertyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_checkpoint_dto_1.VerifyCheckpointDto, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyTrustCheckpoint", null);
__decorate([
    (0, common_1.Get)('reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all reviews across platform for admin moderation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of reviews' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllReviews", null);
__decorate([
    (0, common_1.Patch)('reviews/:id/moderate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a student review' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated review status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, moderate_review_dto_1.ModerateReviewDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "moderateReview", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Platform Administration'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map