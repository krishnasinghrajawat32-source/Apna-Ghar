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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const update_booking_status_dto_1 = require("./dto/update-booking-status.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shared_types_1 = require("@apna-ghar/shared-types");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async previewCharges(bedId) {
        const breakdown = await this.bookingsService.calculateChargesPreview(bedId);
        return {
            success: true,
            data: breakdown,
        };
    }
    async createBooking(studentId, dto) {
        const booking = await this.bookingsService.createBooking(studentId, dto);
        return {
            success: true,
            data: booking,
        };
    }
    async getStudentBookings(studentId) {
        const bookings = await this.bookingsService.getStudentBookings(studentId);
        return {
            success: true,
            data: bookings,
        };
    }
    async getOwnerBookings(ownerId) {
        const bookings = await this.bookingsService.getOwnerBookings(ownerId);
        return {
            success: true,
            data: bookings,
        };
    }
    async getBookingById(bookingId, userId, role) {
        const booking = await this.bookingsService.getBookingById(bookingId, userId, role);
        return {
            success: true,
            data: booking,
        };
    }
    async getMoveInPass(bookingId, userId, role) {
        const pass = await this.bookingsService.getMoveInPass(bookingId, userId, role);
        return {
            success: true,
            data: pass,
        };
    }
    async updateBookingStatus(bookingId, userId, role, dto) {
        const booking = await this.bookingsService.updateBookingStatus(bookingId, userId, role, dto);
        return {
            success: true,
            data: booking,
        };
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('preview-charges'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate itemized rent and deposit charges preview for a bed' }),
    (0, swagger_1.ApiQuery)({ name: 'bedId', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Charges breakdown' }),
    __param(0, (0, common_1.Query)('bedId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "previewCharges", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a pre-payment booking from an active temporary bed hold' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Booking created with unique human-readable reference' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'No active bed hold or invalid move-in date' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings for the authenticated student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of student bookings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getStudentBookings", null);
__decorate([
    (0, common_1.Get)('owner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings across properties owned by authenticated owner' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of owner bookings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getOwnerBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get single booking by ID with ownership check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getBookingById", null);
__decorate([
    (0, common_1.Get)(':id/move-in-pass'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get verified digital move-in pass and checklist for booking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Move-in pass with checklist and QR payload' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getMoveInPass", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.STUDENT, shared_types_1.UserRole.OWNER, shared_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update booking status (cancel by student, or manage by owner/admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_booking_status_dto_1.UpdateBookingStatusDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "updateBookingStatus", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings & Checkout'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map