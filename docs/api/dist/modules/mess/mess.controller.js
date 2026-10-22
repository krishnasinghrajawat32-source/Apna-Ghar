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
exports.MessController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mess_service_1 = require("./mess.service");
const create_mess_subscription_dto_1 = require("./dto/create-mess-subscription.dto");
const update_weekly_menu_dto_1 = require("./dto/update-weekly-menu.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let MessController = class MessController {
    messService;
    constructor(messService) {
        this.messService = messService;
    }
    async findAll(city, dietaryType) {
        const messes = await this.messService.findAll({ city, dietaryType });
        return {
            success: true,
            data: messes,
        };
    }
    async findBySlug(slug) {
        const mess = await this.messService.findBySlug(slug);
        return {
            success: true,
            data: mess,
        };
    }
    async createSubscription(studentId, dto) {
        const subscription = await this.messService.createSubscription(studentId, dto);
        return {
            success: true,
            data: subscription,
        };
    }
    async getStudentSubscriptions(studentId) {
        const subscriptions = await this.messService.getStudentSubscriptions(studentId);
        return {
            success: true,
            data: subscriptions,
        };
    }
    async getPartnerMess(partnerId) {
        const mess = await this.messService.getPartnerMess(partnerId);
        return {
            success: true,
            data: mess,
        };
    }
    async updateWeeklyMenu(partnerId, messId, dto) {
        const mess = await this.messService.updateWeeklyMenu(partnerId, messId, dto.weeklyMenu);
        return {
            success: true,
            data: mess,
        };
    }
    async getPartnerSubscribers(partnerId) {
        const subscribers = await this.messService.getPartnerSubscriptions(partnerId);
        return {
            success: true,
            data: subscribers,
        };
    }
};
exports.MessController = MessController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Discover verified student messes with dietary filtering' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dietaryType', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of verified mess outlets' }),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('dietaryType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mess outlet profile, subscription plans, and rotating weekly menu' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mess profile detail' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)('subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to a monthly mess meal plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Mess subscription created with QR meal pass' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_mess_subscription_dto_1.CreateMessSubscriptionDto]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.Get)('subscriptions/student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List active meal plan subscriptions for logged-in student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of student meal passes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "getStudentSubscriptions", null);
__decorate([
    (0, common_1.Get)('partner/my-mess'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MESS_PARTNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get mess outlet profile managed by logged-in partner' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mess partner profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "getPartnerMess", null);
__decorate([
    (0, common_1.Patch)('partner/weekly-menu'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MESS_PARTNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update weekly rotating breakfast/lunch/dinner menu' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Weekly menu updated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('messId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_weekly_menu_dto_1.UpdateWeeklyMenuDto]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "updateWeeklyMenu", null);
__decorate([
    (0, common_1.Get)('partner/subscribers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MESS_PARTNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List active student meal plan subscribers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of current subscribers' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessController.prototype, "getPartnerSubscribers", null);
exports.MessController = MessController = __decorate([
    (0, swagger_1.ApiTags)('Mess & Meal Plan Subscriptions'),
    (0, common_1.Controller)('mess'),
    __metadata("design:paramtypes", [mess_service_1.MessService])
], MessController);
//# sourceMappingURL=mess.controller.js.map