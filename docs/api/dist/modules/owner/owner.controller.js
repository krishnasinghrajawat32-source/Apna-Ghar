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
exports.OwnerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const owner_service_1 = require("./owner.service");
const update_bed_status_dto_1 = require("./dto/update-bed-status.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let OwnerController = class OwnerController {
    ownerService;
    constructor(ownerService) {
        this.ownerService = ownerService;
    }
    async getOverview(ownerId) {
        const metrics = await this.ownerService.getOverview(ownerId);
        return {
            success: true,
            data: metrics,
        };
    }
    async getProperties(ownerId) {
        const properties = await this.ownerService.getProperties(ownerId);
        return {
            success: true,
            data: properties,
        };
    }
    async getPropertyInventory(ownerId, propertyId) {
        const inventory = await this.ownerService.getPropertyInventory(ownerId, propertyId);
        return {
            success: true,
            data: inventory,
        };
    }
    async updateBedStatus(bedId, ownerId, role, dto) {
        const bed = await this.ownerService.updateBedStatus(bedId, ownerId, role, dto.permanentStatus);
        return {
            success: true,
            data: bed,
        };
    }
};
exports.OwnerController = OwnerController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregated portfolio metrics for authenticated owner' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Aggregated owner overview metrics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('properties'),
    (0, swagger_1.ApiOperation)({ summary: 'List all properties owned by authenticated owner with inventory counts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of owner properties' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "getProperties", null);
__decorate([
    (0, common_1.Get)('properties/:propertyId/inventory'),
    (0, swagger_1.ApiOperation)({ summary: 'Get physical rooms and beds breakdown for an owner property' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hierarchical room and bed inventory' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "getPropertyInventory", null);
__decorate([
    (0, common_1.Patch)('beds/:bedId/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bed operational status between AVAILABLE and MAINTENANCE' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bed status updated' }),
    __param(0, (0, common_1.Param)('bedId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_bed_status_dto_1.UpdateBedStatusDto]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "updateBedStatus", null);
exports.OwnerController = OwnerController = __decorate([
    (0, swagger_1.ApiTags)('Owner Operations & Property Management'),
    (0, common_1.Controller)('owner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [owner_service_1.OwnerService])
], OwnerController);
//# sourceMappingURL=owner.controller.js.map