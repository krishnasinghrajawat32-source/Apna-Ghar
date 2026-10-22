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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pricing_service_1 = require("./pricing.service");
const properties_service_1 = require("../properties/properties.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let PricingController = class PricingController {
    pricingService;
    propertiesService;
    constructor(pricingService, propertiesService) {
        this.pricingService = pricingService;
        this.propertiesService = propertiesService;
    }
    async getCostBreakdown(propertyId, roomTypeId) {
        const cost = await this.pricingService.getCostBreakdown(propertyId, roomTypeId);
        return {
            success: true,
            data: cost,
        };
    }
    async getCostBreakdownBySlug(slug, roomTypeId) {
        const { property } = await this.propertiesService.findBySlug(slug);
        const prop = property;
        const propId = prop.id || prop._id?.toString() || '';
        const cost = await this.pricingService.getCostBreakdown(propId, roomTypeId);
        return {
            success: true,
            data: cost,
        };
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/cost-breakdown'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transparent Total Living Cost breakdown by property ID' }),
    (0, swagger_1.ApiQuery)({ name: 'roomTypeId', required: false, description: 'Specific room type ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Total Living Cost line items and upfront totals' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('roomTypeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getCostBreakdown", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('slug/:slug/cost-breakdown'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transparent Total Living Cost breakdown by property slug' }),
    (0, swagger_1.ApiQuery)({ name: 'roomTypeId', required: false, description: 'Specific room type ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Total Living Cost line items and upfront totals' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('roomTypeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "getCostBreakdownBySlug", null);
exports.PricingController = PricingController = __decorate([
    (0, swagger_1.ApiTags)('Pricing & Living Cost'),
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [pricing_service_1.PricingService,
        properties_service_1.PropertiesService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map