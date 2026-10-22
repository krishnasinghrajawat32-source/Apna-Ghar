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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const colleges_service_1 = require("../colleges/colleges.service");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
const shared_constants_1 = require("@apna-ghar/shared-constants");
let SearchService = SearchService_1 = class SearchService {
    propertyModel;
    collegesService;
    logger = new common_1.Logger(SearchService_1.name);
    constructor(propertyModel, collegesService) {
        this.propertyModel = propertyModel;
        this.collegesService = collegesService;
    }
    async search(dto) {
        const page = dto.page || 1;
        const limit = dto.limit || 12;
        const skip = (page - 1) * limit;
        let centerCoordinates = null;
        let collegeAnchorName = null;
        if (dto.college) {
            try {
                let collegeDoc;
                if (mongoose_2.Types.ObjectId.isValid(dto.college)) {
                    collegeDoc = await this.collegesService.findById(dto.college);
                }
                else {
                    collegeDoc = await this.collegesService.findBySlug(dto.college);
                }
                if (collegeDoc && collegeDoc.location?.coordinates) {
                    centerCoordinates = collegeDoc.location.coordinates;
                    collegeAnchorName = collegeDoc.name;
                }
            }
            catch (err) {
                this.logger.warn(`College anchor lookup '${dto.college}' did not resolve: ${err}`);
            }
        }
        const pipeline = [];
        // Stage 1: Geospatial $geoNear if college coordinates are resolved
        if (centerCoordinates) {
            pipeline.push({
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: centerCoordinates,
                    },
                    distanceField: 'distanceMeters',
                    maxDistance: dto.radius || 3000,
                    spherical: true,
                    query: {
                        status: 'ACTIVE',
                        ...(dto.gender ? { genderPreference: dto.gender } : {}),
                        ...(dto.verifiedOnly ? { isFullyVerified: true } : {}),
                    },
                },
            });
        }
        else {
            pipeline.push({
                $match: {
                    status: 'ACTIVE',
                    ...(dto.gender ? { genderPreference: dto.gender } : {}),
                    ...(dto.verifiedOnly ? { isFullyVerified: true } : {}),
                },
            });
        }
        // Stage 2: Join roomTypes to compute starting rent, AC, and sharing
        pipeline.push({
            $lookup: {
                from: 'roomTypes',
                localField: '_id',
                foreignField: 'propertyId',
                as: 'roomTypes',
            },
        }, {
            $lookup: {
                from: 'beds',
                localField: '_id',
                foreignField: 'propertyId',
                as: 'beds',
            },
        }, {
            $addFields: {
                startingRent: { $min: '$roomTypes.baseRent' },
                hasAc: {
                    $in: [true, '$roomTypes.ac'],
                },
                hasFood: {
                    $in: [true, '$roomTypes.foodIncluded'],
                },
                sharingTypes: '$roomTypes.sharingType',
                totalBedsCount: { $size: '$beds' },
                availableBedsCount: {
                    $size: {
                        $filter: {
                            input: '$beds',
                            as: 'b',
                            cond: { $eq: ['$$b.permanentStatus', shared_types_1.BedStatus.AVAILABLE] },
                        },
                    },
                },
            },
        });
        // Stage 3: Dynamic filters on joined room fields
        const joinedMatch = {};
        if (dto.minPrice !== undefined) {
            joinedMatch['startingRent'] = { ...(joinedMatch['startingRent'] || {}), $gte: dto.minPrice };
        }
        if (dto.maxPrice !== undefined) {
            joinedMatch['startingRent'] = { ...(joinedMatch['startingRent'] || {}), $lte: dto.maxPrice };
        }
        if (dto.ac !== undefined) {
            joinedMatch['hasAc'] = dto.ac;
        }
        if (dto.food !== undefined) {
            joinedMatch['hasFood'] = dto.food;
        }
        if (dto.sharing) {
            joinedMatch['sharingTypes'] = dto.sharing;
        }
        if (Object.keys(joinedMatch).length > 0) {
            pipeline.push({ $match: joinedMatch });
        }
        // Count facet for pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        // Sorting Stage
        let sortStage = { isFullyVerified: -1, createdAt: -1 };
        if (dto.sort === 'nearest' && centerCoordinates) {
            sortStage = { distanceMeters: 1 };
        }
        else if (dto.sort === 'lowest_rent') {
            sortStage = { startingRent: 1 };
        }
        else if (dto.sort === 'recently_updated') {
            sortStage = { lastAvailabilityUpdatedAt: -1 };
        }
        pipeline.push({ $sort: sortStage }, { $skip: skip }, { $limit: limit });
        const [results, countResult] = await Promise.all([
            this.propertyModel.aggregate(pipeline).exec(),
            this.propertyModel.aggregate(countPipeline).exec(),
        ]);
        const total = countResult[0]?.total || 0;
        const hasNext = skip + results.length < total;
        const formattedData = results.map((item) => {
            const updatedAt = item.lastAvailabilityUpdatedAt
                ? new Date(item.lastAvailabilityUpdatedAt)
                : new Date(item.updatedAt);
            const diffHours = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
            let freshness = shared_types_1.AvailabilityFreshness.FRESH;
            if (diffHours > shared_constants_1.FRESHNESS_THRESHOLDS.NEEDS_CONFIRMATION_HOURS) {
                freshness = shared_types_1.AvailabilityFreshness.STALE;
            }
            else if (diffHours > shared_constants_1.FRESHNESS_THRESHOLDS.FRESH_HOURS) {
                freshness = shared_types_1.AvailabilityFreshness.NEEDS_CONFIRMATION;
            }
            return {
                id: item._id.toString(),
                name: item.name,
                slug: item.slug,
                propertyType: item.propertyType,
                address: {
                    street: item.address?.street || '',
                    city: item.address?.city || '',
                    state: item.address?.state || '',
                },
                location: item.location,
                genderPreference: item.genderPreference,
                furnishing: item.furnishing,
                isFullyVerified: !!item.isFullyVerified,
                distanceMeters: item.distanceMeters !== undefined ? Math.round(item.distanceMeters) : undefined,
                startingRent: item.startingRent || 0,
                availableBedsCount: item.availableBedsCount || 0,
                totalBedsCount: item.totalBedsCount || 0,
                hasAc: !!item.hasAc,
                hasFood: !!item.hasFood,
                sharingTypes: Array.from(new Set(item.sharingTypes || [])),
                images: item.images || [],
                freshness,
                lastAvailabilityUpdatedAt: updatedAt.toISOString(),
            };
        });
        return {
            collegeAnchor: collegeAnchorName,
            data: formattedData,
            meta: {
                page,
                limit,
                total,
                hasNext,
            },
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        colleges_service_1.CollegesService])
], SearchService);
//# sourceMappingURL=search.service.js.map