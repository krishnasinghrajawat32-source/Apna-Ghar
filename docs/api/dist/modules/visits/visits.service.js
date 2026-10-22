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
var VisitsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitsService = exports.STANDARD_VISIT_SLOTS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const visit_schema_1 = require("./schemas/visit.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
exports.STANDARD_VISIT_SLOTS = [
    '10:00-12:00',
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00',
];
let VisitsService = VisitsService_1 = class VisitsService {
    visitModel;
    propertyModel;
    logger = new common_1.Logger(VisitsService_1.name);
    constructor(visitModel, propertyModel) {
        this.visitModel = visitModel;
        this.propertyModel = propertyModel;
    }
    /**
     * Schedule a new visit request by student
     */
    async createVisit(studentId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.propertyId)) {
            throw new common_1.BadRequestException(`Invalid property ID: ${dto.propertyId}`);
        }
        const property = await this.propertyModel.findById(dto.propertyId).exec();
        if (!property) {
            throw new common_1.NotFoundException(`Property with ID ${dto.propertyId} not found`);
        }
        const scheduledDate = new Date(dto.scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (scheduledDate < today) {
            throw new common_1.BadRequestException('Cannot schedule a visit for a date in the past');
        }
        // Check for duplicate pending/confirmed visit on the same day for this student
        const existing = await this.visitModel.findOne({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            propertyId: property._id,
            scheduledAt: {
                $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
                $lte: new Date(scheduledDate.setHours(23, 59, 59, 999)),
            },
            status: { $in: [shared_types_1.VisitStatus.REQUESTED, shared_types_1.VisitStatus.CONFIRMED] },
        }).exec();
        if (existing) {
            throw new common_1.BadRequestException('You already have an active visit scheduled for this property on this date');
        }
        const visit = await this.visitModel.create({
            studentId: new mongoose_2.Types.ObjectId(studentId),
            propertyId: property._id,
            ownerId: property.ownerId,
            scheduledAt: new Date(dto.scheduledDate),
            slot: dto.slot,
            contactPhone: dto.contactPhone,
            notes: dto.notes || '',
            status: shared_types_1.VisitStatus.REQUESTED,
        });
        this.logger.log(`Created visit request ${visit._id} for property ${property.name}`);
        return visit;
    }
    /**
     * Get all visits for the currently authenticated student
     */
    async getStudentVisits(studentId) {
        return this.visitModel
            .find({ studentId: new mongoose_2.Types.ObjectId(studentId) })
            .populate('propertyId', 'name slug images address propertyType genderPreference')
            .sort({ scheduledAt: -1 })
            .exec();
    }
    /**
     * Get all incoming visits for an owner
     */
    async getOwnerVisits(ownerId) {
        return this.visitModel
            .find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) })
            .populate('propertyId', 'name slug address')
            .populate('studentId', 'name email phone')
            .sort({ scheduledAt: -1 })
            .exec();
    }
    /**
     * Get visit by ID with authorization check
     */
    async getVisitById(visitId, userId, role) {
        if (!mongoose_2.Types.ObjectId.isValid(visitId)) {
            throw new common_1.BadRequestException(`Invalid visit ID: ${visitId}`);
        }
        const visit = await this.visitModel
            .findById(visitId)
            .populate('propertyId', 'name slug images address')
            .populate('studentId', 'name email phone')
            .exec();
        if (!visit) {
            throw new common_1.NotFoundException(`Visit with ID ${visitId} not found`);
        }
        const isStudent = visit.studentId.toString() === userId;
        const isOwner = visit.ownerId.toString() === userId;
        const isAdmin = role === shared_types_1.UserRole.ADMIN;
        if (!isStudent && !isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to view this visit');
        }
        return visit;
    }
    /**
     * Update visit status (student cancel, or owner confirm/reject/complete)
     */
    async updateVisitStatus(visitId, userId, role, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(visitId)) {
            throw new common_1.BadRequestException(`Invalid visit ID: ${visitId}`);
        }
        const visit = await this.visitModel.findById(visitId).exec();
        if (!visit) {
            throw new common_1.NotFoundException(`Visit with ID ${visitId} not found`);
        }
        const isStudent = visit.studentId.toString() === userId;
        const isOwner = visit.ownerId.toString() === userId;
        const isAdmin = role === shared_types_1.UserRole.ADMIN;
        // Student can only cancel their own visit
        if (isStudent && !isOwner && !isAdmin) {
            if (dto.status !== shared_types_1.VisitStatus.CANCELLED) {
                throw new common_1.ForbiddenException('Students may only cancel their scheduled visits');
            }
        }
        else if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to modify this visit');
        }
        visit.status = dto.status;
        if (dto.reason) {
            visit.cancelledReason = dto.reason;
        }
        await visit.save();
        this.logger.log(`Updated visit ${visit._id} status to ${dto.status}`);
        return visit;
    }
    /**
     * Get available slots for a property on a specific date
     */
    async getAvailableSlots(propertyId, dateString) {
        if (!mongoose_2.Types.ObjectId.isValid(propertyId)) {
            throw new common_1.BadRequestException(`Invalid property ID: ${propertyId}`);
        }
        const targetDate = new Date(dateString);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        // Find already booked slots
        const confirmedVisits = await this.visitModel
            .find({
            propertyId: new mongoose_2.Types.ObjectId(propertyId),
            scheduledAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: [shared_types_1.VisitStatus.CONFIRMED, shared_types_1.VisitStatus.REQUESTED] },
        })
            .exec();
        const bookedSlots = new Set(confirmedVisits.map((v) => v.slot));
        return {
            date: dateString,
            slots: exports.STANDARD_VISIT_SLOTS.map((slot) => ({
                slot,
                available: !bookedSlots.has(slot),
            })),
        };
    }
};
exports.VisitsService = VisitsService;
exports.VisitsService = VisitsService = VisitsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(visit_schema_1.Visit.name)),
    __param(1, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], VisitsService);
//# sourceMappingURL=visits.service.js.map