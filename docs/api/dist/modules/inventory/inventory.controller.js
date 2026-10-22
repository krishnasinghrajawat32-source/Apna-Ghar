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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const hold_bed_dto_1 = require("./dto/hold-bed.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async getPropertyInventory(propertyId, currentUserId) {
        const data = await this.inventoryService.getDetailedAvailability(propertyId, currentUserId);
        return {
            success: true,
            data,
        };
    }
    async holdBed(bedId, studentId, dto) {
        const hold = await this.inventoryService.holdBed(bedId, studentId, dto.ttlSeconds);
        return {
            success: true,
            data: hold,
        };
    }
    async releaseHold(bedId, studentId) {
        const result = await this.inventoryService.releaseHold(bedId, studentId);
        return {
            success: true,
            data: result,
        };
    }
    async getBedHoldStatus(bedId, currentUserId) {
        const status = await this.inventoryService.getBedHoldStatus(bedId, currentUserId);
        return {
            success: true,
            data: status,
        };
    }
    async getUserActiveHold(studentId) {
        const activeHold = await this.inventoryService.getUserActiveHold(studentId);
        return {
            success: true,
            data: activeHold,
        };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('properties/:propertyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get structured rooms and beds inventory with real-time bed hold statuses' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hierarchical inventory layout and availability' }),
    __param(0, (0, common_1.Param)('propertyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPropertyInventory", null);
__decorate([
    (0, common_1.Post)('beds/:bedId/hold'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Temporarily hold an exact bed for 8 minutes via atomic Redis lock' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bed hold acquired' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Bed is currently held by another student' }),
    __param(0, (0, common_1.Param)('bedId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, hold_bed_dto_1.HoldBedDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "holdBed", null);
__decorate([
    (0, common_1.Delete)('beds/:bedId/hold'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Release an active bed hold early' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hold released successfully' }),
    __param(0, (0, common_1.Param)('bedId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "releaseHold", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('beds/:bedId/hold-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current hold status and remaining TTL for a specific bed' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bed hold status' }),
    __param(0, (0, common_1.Param)('bedId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getBedHoldStatus", null);
__decorate([
    (0, common_1.Get)('user/active-hold'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get active bed hold and bed details for the logged-in student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active student hold or null' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getUserActiveHold", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory, Room & Bed Selection'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map