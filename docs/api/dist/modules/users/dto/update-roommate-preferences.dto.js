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
exports.UpdateRoommatePreferencesDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateRoommatePreferencesDto {
    sleepSchedule;
    foodPreference;
    cleanlinessLevel;
    studyHabits;
    smoking;
    hobbies;
}
exports.UpdateRoommatePreferencesDto = UpdateRoommatePreferencesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'], example: 'NIGHT_OWL' }),
    (0, class_validator_1.IsEnum)(['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRoommatePreferencesDto.prototype, "sleepSchedule", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN', 'ANY'], example: 'VEG' }),
    (0, class_validator_1.IsEnum)(['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN', 'ANY']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRoommatePreferencesDto.prototype, "foodPreference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['STRICT', 'MODERATE', 'CASUAL'], example: 'MODERATE' }),
    (0, class_validator_1.IsEnum)(['STRICT', 'MODERATE', 'CASUAL']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRoommatePreferencesDto.prototype, "cleanlinessLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['SILENT', 'GROUP', 'MUSIC_OK'], example: 'SILENT' }),
    (0, class_validator_1.IsEnum)(['SILENT', 'GROUP', 'MUSIC_OK']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRoommatePreferencesDto.prototype, "studyHabits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateRoommatePreferencesDto.prototype, "smoking", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['Coding', 'Music', 'Chess'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateRoommatePreferencesDto.prototype, "hobbies", void 0);
//# sourceMappingURL=update-roommate-preferences.dto.js.map