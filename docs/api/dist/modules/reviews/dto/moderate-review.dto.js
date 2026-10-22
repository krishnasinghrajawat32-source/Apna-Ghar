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
exports.ModerateReviewDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const shared_types_1 = require("@apna-ghar/shared-types");
class ModerateReviewDto {
    status;
    moderationNote;
}
exports.ModerateReviewDto = ModerateReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_types_1.ReviewStatus, description: 'New moderation status for the review' }),
    (0, class_validator_1.IsEnum)(shared_types_1.ReviewStatus),
    __metadata("design:type", String)
], ModerateReviewDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional moderation notes or rejection reason' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModerateReviewDto.prototype, "moderationNote", void 0);
//# sourceMappingURL=moderate-review.dto.js.map