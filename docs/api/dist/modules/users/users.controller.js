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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const update_roommate_preferences_dto_1 = require("./dto/update-roommate-preferences.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getRoommatePreferences(userId) {
        const preferences = await this.usersService.getRoommatePreferences(userId);
        return {
            success: true,
            data: preferences,
        };
    }
    async updateRoommatePreferences(userId, dto) {
        const updated = await this.usersService.updateRoommatePreferences(userId, dto);
        return {
            success: true,
            data: updated,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('roommate-preferences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get current student roommate preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student roommate preferences' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRoommatePreferences", null);
__decorate([
    (0, common_1.Patch)('roommate-preferences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update student roommate preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated roommate preferences' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_roommate_preferences_dto_1.UpdateRoommatePreferencesDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRoommatePreferences", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users & Student Profiles'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map