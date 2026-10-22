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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfileSchema = exports.StudentProfile = exports.RoommatePreferences = exports.EmergencyContact = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const shared_types_1 = require("@apna-ghar/shared-types");
let EmergencyContact = class EmergencyContact {
    name;
    phone;
    relation;
};
exports.EmergencyContact = EmergencyContact;
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmergencyContact.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmergencyContact.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmergencyContact.prototype, "relation", void 0);
exports.EmergencyContact = EmergencyContact = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], EmergencyContact);
const EmergencyContactSchema = mongoose_1.SchemaFactory.createForClass(EmergencyContact);
let RoommatePreferences = class RoommatePreferences {
    sleepSchedule;
    foodPreference;
    cleanlinessLevel;
    studyHabits;
    smoking;
    hobbies;
};
exports.RoommatePreferences = RoommatePreferences;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'], default: 'FLEXIBLE' }),
    __metadata("design:type", String)
], RoommatePreferences.prototype, "sleepSchedule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN', 'ANY'], default: 'ANY' }),
    __metadata("design:type", String)
], RoommatePreferences.prototype, "foodPreference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['STRICT', 'MODERATE', 'CASUAL'], default: 'MODERATE' }),
    __metadata("design:type", String)
], RoommatePreferences.prototype, "cleanlinessLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['SILENT', 'GROUP', 'MUSIC_OK'], default: 'SILENT' }),
    __metadata("design:type", String)
], RoommatePreferences.prototype, "studyHabits", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], RoommatePreferences.prototype, "smoking", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], RoommatePreferences.prototype, "hobbies", void 0);
exports.RoommatePreferences = RoommatePreferences = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], RoommatePreferences);
const RoommatePreferencesSchema = mongoose_1.SchemaFactory.createForClass(RoommatePreferences);
let StudentProfile = class StudentProfile {
    userId;
    collegeId;
    gender;
    course;
    yearOfStudy;
    emergencyContact;
    roommatePreferences;
};
exports.StudentProfile = StudentProfile;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StudentProfile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'College', default: null }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "collegeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(shared_types_1.GenderPreference),
        default: null,
    }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], StudentProfile.prototype, "course", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1 }),
    __metadata("design:type", Number)
], StudentProfile.prototype, "yearOfStudy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: EmergencyContactSchema, default: () => ({}) }),
    __metadata("design:type", EmergencyContact)
], StudentProfile.prototype, "emergencyContact", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: RoommatePreferencesSchema, default: () => ({}) }),
    __metadata("design:type", RoommatePreferences)
], StudentProfile.prototype, "roommatePreferences", void 0);
exports.StudentProfile = StudentProfile = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'studentProfiles',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id ? ret._id.toString() : '';
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], StudentProfile);
exports.StudentProfileSchema = mongoose_1.SchemaFactory.createForClass(StudentProfile);
//# sourceMappingURL=student-profile.schema.js.map