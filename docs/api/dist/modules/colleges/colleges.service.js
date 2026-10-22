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
var CollegesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const college_schema_1 = require("./schemas/college.schema");
let CollegesService = CollegesService_1 = class CollegesService {
    collegeModel;
    logger = new common_1.Logger(CollegesService_1.name);
    constructor(collegeModel) {
        this.collegeModel = collegeModel;
    }
    async onModuleInit() {
        const isConnected = !this.collegeModel.db || this.collegeModel.db.readyState === 1;
        if (isConnected) {
            await this.seedInitialColleges();
        }
        else {
            this.collegeModel.db.once('connected', () => {
                this.seedInitialColleges().catch((err) => {
                    this.logger.warn(`College seeding skipped or deferred: ${err.message}`);
                });
            });
        }
    }
    async search(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return this.collegeModel
                .find({ status: 'ACTIVE' })
                .sort({ name: 1 })
                .limit(limit)
                .exec();
        }
        const cleanQuery = query.trim();
        return this.collegeModel
            .find({
            status: 'ACTIVE',
            $or: [
                { name: { $regex: cleanQuery, $options: 'i' } },
                { city: { $regex: cleanQuery, $options: 'i' } },
            ],
        })
            .sort({ name: 1 })
            .limit(limit)
            .exec();
    }
    async findBySlug(slug) {
        const college = await this.collegeModel
            .findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' })
            .exec();
        if (!college) {
            throw new common_1.NotFoundException(`College with slug '${slug}' not found.`);
        }
        return college;
    }
    async findById(id) {
        const college = await this.collegeModel.findById(id).exec();
        if (!college) {
            throw new common_1.NotFoundException(`College not found.`);
        }
        return college;
    }
    async seedInitialColleges() {
        try {
            const count = await this.collegeModel.countDocuments();
            if (count > 0)
                return;
            this.logger.log('Seeding initial verified university coordinates for geo-search...');
            const initialColleges = [
                {
                    name: 'Amity University Noida',
                    slug: 'amity-university-noida',
                    city: 'Noida',
                    state: 'Uttar Pradesh',
                    // [longitude, latitude]
                    location: {
                        type: 'Point',
                        coordinates: [77.3331, 28.5434],
                    },
                    status: 'ACTIVE',
                },
                {
                    name: 'IIT Delhi',
                    slug: 'iit-delhi',
                    city: 'New Delhi',
                    state: 'Delhi',
                    location: {
                        type: 'Point',
                        coordinates: [77.1926, 28.545],
                    },
                    status: 'ACTIVE',
                },
                {
                    name: 'Delhi University (North Campus)',
                    slug: 'delhi-university-north-campus',
                    city: 'Delhi',
                    state: 'Delhi',
                    location: {
                        type: 'Point',
                        coordinates: [77.2076, 28.6892],
                    },
                    status: 'ACTIVE',
                },
                {
                    name: 'BITS Pilani',
                    slug: 'bits-pilani',
                    city: 'Pilani',
                    state: 'Rajasthan',
                    location: {
                        type: 'Point',
                        coordinates: [75.5878, 28.3639],
                    },
                    status: 'ACTIVE',
                },
            ];
            await this.collegeModel.insertMany(initialColleges);
            this.logger.log(`Successfully seeded ${initialColleges.length} university anchors.`);
        }
        catch (err) {
            this.logger.warn(`Initial college seeding skipped or deferred: ${err.message}`);
        }
    }
};
exports.CollegesService = CollegesService;
exports.CollegesService = CollegesService = CollegesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(college_schema_1.College.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CollegesService);
//# sourceMappingURL=colleges.service.js.map