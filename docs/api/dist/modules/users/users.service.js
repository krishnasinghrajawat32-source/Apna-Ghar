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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
const shared_constants_1 = require("@apna-ghar/shared-constants");
const user_schema_1 = require("./schemas/user.schema");
const student_profile_schema_1 = require("./schemas/student-profile.schema");
const owner_profile_schema_1 = require("./schemas/owner-profile.schema");
const mess_partner_profile_schema_1 = require("./schemas/mess-partner-profile.schema");
let UsersService = class UsersService {
    userModel;
    studentProfileModel;
    ownerProfileModel;
    messPartnerProfileModel;
    constructor(userModel, studentProfileModel, ownerProfileModel, messPartnerProfileModel) {
        this.userModel = userModel;
        this.studentProfileModel = studentProfileModel;
        this.ownerProfileModel = ownerProfileModel;
        this.messPartnerProfileModel = messPartnerProfileModel;
    }
    async create(data) {
        const existing = await this.userModel.findOne({ email: data.email.toLowerCase() });
        if (existing) {
            throw new common_1.ConflictException({
                code: shared_constants_1.ERROR_CODES.AUTH_EMAIL_EXISTS,
                message: 'An account with this email address already exists.',
            });
        }
        const user = await this.userModel.create({
            name: data.name,
            email: data.email.toLowerCase(),
            phone: data.phone,
            passwordHash: data.passwordHash,
            role: data.role,
        });
        // Automatically create corresponding profile
        if (data.role === shared_types_1.UserRole.STUDENT) {
            await this.studentProfileModel.create({ userId: user._id });
        }
        else if (data.role === shared_types_1.UserRole.OWNER) {
            await this.ownerProfileModel.create({ userId: user._id });
        }
        else if (data.role === shared_types_1.UserRole.MESS_PARTNER) {
            await this.messPartnerProfileModel.create({ userId: user._id });
        }
        return user;
    }
    async findByEmail(email, includePassword = false) {
        const query = this.userModel.findOne({ email: email.toLowerCase() });
        if (includePassword) {
            query.select('+passwordHash');
        }
        return query.exec();
    }
    async findById(id, includeTokens = false) {
        const query = this.userModel.findById(id);
        if (includeTokens) {
            query.select('+refreshTokenHash +resetPasswordTokenHash +resetPasswordExpires');
        }
        return query.exec();
    }
    async updateRefreshToken(id, refreshTokenHash) {
        await this.userModel.updateOne({ _id: id }, { $set: { refreshTokenHash } });
    }
    async setResetPasswordToken(id, resetPasswordTokenHash, resetPasswordExpires) {
        await this.userModel.updateOne({ _id: id }, {
            $set: {
                resetPasswordTokenHash,
                resetPasswordExpires,
            },
        });
    }
    async findActivePasswordResetCandidates() {
        return this.userModel.find({
            resetPasswordExpires: { $gt: new Date() },
        }).select('+resetPasswordTokenHash').exec();
    }
    async resetPassword(id, passwordHash) {
        await this.userModel.updateOne({ _id: id }, {
            $set: {
                passwordHash,
                resetPasswordTokenHash: null,
                resetPasswordExpires: null,
            },
        });
    }
    async getProfile(userId, role) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException({
                code: shared_constants_1.ERROR_CODES.AUTH_USER_NOT_FOUND,
                message: 'User not found.',
            });
        }
        let profile = null;
        if (role === shared_types_1.UserRole.STUDENT) {
            profile = await this.studentProfileModel.findOne({ userId });
        }
        else if (role === shared_types_1.UserRole.OWNER) {
            profile = await this.ownerProfileModel.findOne({ userId });
        }
        else if (role === shared_types_1.UserRole.MESS_PARTNER) {
            profile = await this.messPartnerProfileModel.findOne({ userId });
        }
        return {
            user: user.toJSON(),
            profile,
        };
    }
    async getRoommatePreferences(userId) {
        const profile = await this.studentProfileModel.findOne({ userId });
        if (!profile) {
            throw new common_1.NotFoundException('Student profile not found.');
        }
        return profile.roommatePreferences || {
            sleepSchedule: 'FLEXIBLE',
            foodPreference: 'ANY',
            cleanlinessLevel: 'MODERATE',
            studyHabits: 'SILENT',
            smoking: false,
            hobbies: [],
        };
    }
    async updateRoommatePreferences(userId, dto = {}) {
        let profile = await this.studentProfileModel.findOne({ userId });
        if (!profile) {
            profile = await this.studentProfileModel.create({ userId });
        }
        const current = profile.roommatePreferences || {
            sleepSchedule: 'FLEXIBLE',
            foodPreference: 'ANY',
            cleanlinessLevel: 'MODERATE',
            studyHabits: 'SILENT',
            smoking: false,
            hobbies: [],
        };
        profile.roommatePreferences = {
            sleepSchedule: dto.sleepSchedule ?? current.sleepSchedule,
            foodPreference: dto.foodPreference ?? current.foodPreference,
            cleanlinessLevel: dto.cleanlinessLevel ?? current.cleanlinessLevel,
            studyHabits: dto.studyHabits ?? current.studyHabits,
            smoking: dto.smoking !== undefined ? dto.smoking : current.smoking,
            hobbies: dto.hobbies ?? current.hobbies,
        };
        await profile.save();
        return profile.roommatePreferences;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(owner_profile_schema_1.OwnerProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(mess_partner_profile_schema_1.MessPartnerProfile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map