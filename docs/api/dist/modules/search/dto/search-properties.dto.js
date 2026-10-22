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
exports.SearchPropertiesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const shared_types_1 = require("@apna-ghar/shared-types");
class SearchPropertiesDto {
    college;
    radius = 3000;
    minPrice;
    maxPrice;
    gender;
    sharing;
    ac;
    food;
    verifiedOnly;
    sort = 'recommended';
    page = 1;
    limit = 12;
}
exports.SearchPropertiesDto = SearchPropertiesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'College ID or slug' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchPropertiesDto.prototype, "college", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search radius in meters (e.g. 1000, 3000, 5000)', default: 3000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(500),
    (0, class_validator_1.Max)(50000),
    __metadata("design:type", Number)
], SearchPropertiesDto.prototype, "radius", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum rent in INR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchPropertiesDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum rent in INR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchPropertiesDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_types_1.GenderPreference }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(Object.values(shared_types_1.GenderPreference)),
    __metadata("design:type", String)
], SearchPropertiesDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: shared_types_1.SharingType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(Object.values(shared_types_1.SharingType)),
    __metadata("design:type", String)
], SearchPropertiesDto.prototype, "sharing", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by AC' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchPropertiesDto.prototype, "ac", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Food Included' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchPropertiesDto.prototype, "food", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by verified properties only' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchPropertiesDto.prototype, "verifiedOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort criteria: nearest | lowest_rent | recommended | recently_updated' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['nearest', 'lowest_rent', 'recommended', 'recently_updated']),
    __metadata("design:type", String)
], SearchPropertiesDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchPropertiesDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 12 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], SearchPropertiesDto.prototype, "limit", void 0);
//# sourceMappingURL=search-properties.dto.js.map