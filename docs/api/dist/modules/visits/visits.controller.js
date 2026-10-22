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
exports.VisitsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const visits_service_1 = require("./visits.service");
const create_visit_dto_1 = require("./dto/create-visit.dto");
const update_visit_status_dto_1 = require("./dto/update-visit-status.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let VisitsController = class VisitsController {
    visitsService;
    constructor(visitsService) {
        this.visitsService = visitsService;
    }
    async getAvailableSlots(propertyId, date) {
        const slots = await this.visitsService.getAvailableSlots(propertyId, date);
        return {
            success: true,
            data: slots,
        };
    }
    async createVisit(studentId, dto) {
        const visit = await this.visitsService.createVisit(studentId, dto);
        return {
            success: true,
            data: visit,
        };
    }
    async getStudentVisits(studentId) {
        const visits = await this.visitsService.getStudentVisits(studentId);
        return {
            success: true,
            data: visits,
        };
    }
    async getOwnerVisits(ownerId) {
        const visits = await this.visitsService.getOwnerVisits(ownerId);
        return {
            success: true,
            data: visits,
        };
    }
    async getVisitById(visitId, userId, role) {
        const visit = await this.visitsService.getVisitById(visitId, userId, role);
        return {
            success: true,
            data: visit,
        };
    }
    async updateStatus(visitId, userId, role, dto) {
        const visit = await this.visitsService.updateVisitStatus(visitId, userId, role, dto);
        return {
            success: true,
            data: visit,
        };
    }
};
exports.VisitsController = VisitsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available visit slots for a property on a given date' }),
    (0, swagger_1.ApiQuery)({ name: 'propertyId', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, example: '2026-10-25' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available time slots' }),
    __param(0, (0, common_1.Query)('propertyId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VisitsController.prototype, "getAvailableSlots", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule a free physical visit to a property' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Visit successfully requested' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_visit_dto_1.CreateVisitDto]),
    __metadata("design:returntype", Promise)
], VisitsController.prototype, "createVisit", null);
__decorate([
    (0, common_1.Get)('student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List visits scheduled by the current student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of student visits' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VisitsController.prototype, "getStudentVisits", null);
__decorate([
    (0, common_1.Get)('owner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List visits scheduled for properties owned by the current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of owner visits' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VisitsController.prototype, "getOwnerVisits", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get visit details by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Visit details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VisitsController.prototype, "getVisitById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update visit status (cancel, confirm, reject, complete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated visit record' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_visit_status_dto_1.UpdateVisitStatusDto]),
    __metadata("design:returntype", Promise)
], VisitsController.prototype, "updateStatus", null);
exports.VisitsController = VisitsController = __decorate([
    (0, swagger_1.ApiTags)('Visits & Scheduling'),
    (0, common_1.Controller)('visits'),
    __metadata("design:paramtypes", [visits_service_1.VisitsService])
], VisitsController);
//# sourceMappingURL=visits.controller.js.map