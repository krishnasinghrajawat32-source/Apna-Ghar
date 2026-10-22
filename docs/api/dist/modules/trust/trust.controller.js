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
exports.TrustController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const trust_service_1 = require("./trust.service");
const verify_checkpoint_dto_1 = require("./dto/verify-checkpoint.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let TrustController = class TrustController {
    trustService;
    constructor(trustService) {
        this.trustService = trustService;
    }
    async getPassport(propertyId) {
        const passport = await this.trustService.getPassportByPropertyId(propertyId);
        return {
            success: true,
            data: passport,
        };
    }
    async getPassportBySlug(slug) {
        const passport = await this.trustService.getPassportByPropertySlug(slug);
        return {
            success: true,
            data: passport,
        };
    }
    async verifyCheckpoint(propertyId, dto, auditorId) {
        const passport = await this.trustService.verifyCheckpoint(propertyId, dto, auditorId);
        return {
            success: true,
            data: passport,
        };
    }
    async confirmFreshness(propertyId) {
        const result = await this.trustService.confirmAvailabilityFreshness(propertyId);
        return {
            success: true,
            data: result,
        };
    }
};
exports.TrustController = TrustController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/trust-passport'),
    (0, swagger_1.ApiOperation)({ summary: 'Get 7-point audit Trust Passport for a property' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trust Passport details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "getPassport", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('slug/:slug/trust-passport'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Trust Passport by property slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trust Passport details' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "getPassportBySlug", null);
__decorate([
    (0, common_1.Post)(':id/trust-passport/verify-checkpoint'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update a specific verification checkpoint (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated Trust Passport' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_checkpoint_dto_1.VerifyCheckpointDto, String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "verifyCheckpoint", null);
__decorate([
    (0, common_1.Post)(':id/freshness/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm current bed availability and refresh availability timestamp' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Availability refreshed successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "confirmFreshness", null);
exports.TrustController = TrustController = __decorate([
    (0, swagger_1.ApiTags)('Trust & Verification'),
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [trust_service_1.TrustService])
], TrustController);
//# sourceMappingURL=trust.controller.js.map