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
exports.CollegesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const colleges_service_1 = require("./colleges.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let CollegesController = class CollegesController {
    collegesService;
    constructor(collegesService) {
        this.collegesService = collegesService;
    }
    async search(query, limit) {
        const results = await this.collegesService.search(query || '', limit ? Number(limit) : 10);
        return results.map((c) => c.toJSON());
    }
    async findBySlug(slug) {
        const college = await this.collegesService.findBySlug(slug);
        return college.toJSON();
    }
};
exports.CollegesController = CollegesController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Autocomplete search for colleges by name or city' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Matched universities with GeoJSON location' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], CollegesController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get college profile and coordinates by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'College profile' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollegesController.prototype, "findBySlug", null);
exports.CollegesController = CollegesController = __decorate([
    (0, swagger_1.ApiTags)('Colleges'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('colleges'),
    __metadata("design:paramtypes", [colleges_service_1.CollegesService])
], CollegesController);
//# sourceMappingURL=colleges.controller.js.map