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
exports.CreateBookingDto = exports.EmergencyContactDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class EmergencyContactDto {
    name;
    relationship;
    phone;
}
exports.EmergencyContactDto = EmergencyContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full name of emergency contact', example: 'Rajesh Sharma' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EmergencyContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Relationship to student', example: 'Father' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EmergencyContactDto.prototype, "relationship", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '10-digit phone number', example: '9876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/, {
        message: 'Emergency contact phone number must be a valid 10-digit Indian mobile number',
    }),
    __metadata("design:type", String)
], EmergencyContactDto.prototype, "phone", void 0);
class CreateBookingDto {
    bedId;
    moveInDate;
    emergencyContact;
    studentIdCardRef;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'MongoDB ObjectId of the bed currently held in Redis',
        example: '6ad4e48590c6162694740178',
    }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "bedId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Anticipated move-in date (ISO-8601 string, must be within next 60 days)',
        example: '2026-11-01',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "moveInDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Emergency contact details', type: EmergencyContactDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EmergencyContactDto),
    __metadata("design:type", EmergencyContactDto)
], CreateBookingDto.prototype, "emergencyContact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reference / URL to uploaded student college ID card',
        example: 'student-id-docs/amity-2026-id.pdf',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "studentIdCardRef", void 0);
//# sourceMappingURL=create-booking.dto.js.map