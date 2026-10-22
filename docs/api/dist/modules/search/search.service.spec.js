"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const search_service_1 = require("./search.service");
const colleges_service_1 = require("../colleges/colleges.service");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('SearchService', () => {
    let service;
    let mockPropertyModel;
    let mockCollegesService;
    const mockCollege = {
        _id: '651a1a2b3c4d5e6f7a8b9c11',
        name: 'Amity University Noida',
        slug: 'amity-university-noida',
        location: {
            type: 'Point',
            coordinates: [77.3331, 28.5434],
        },
    };
    const mockAggregatedProperty = {
        _id: '651a1a2b3c4d5e6f7a8b9c22',
        name: 'Greenwood Student Residency',
        slug: 'greenwood-student-residency-noida',
        propertyType: 'PG',
        address: { street: 'Sector 125', city: 'Noida', state: 'Uttar Pradesh' },
        location: { type: 'Point', coordinates: [77.3315, 28.5412] },
        genderPreference: 'BOYS',
        furnishing: 'FULLY_FURNISHED',
        isFullyVerified: true,
        distanceMeters: 785,
        startingRent: 8500,
        availableBedsCount: 2,
        totalBedsCount: 3,
        hasAc: true,
        hasFood: true,
        sharingTypes: ['SINGLE', 'DOUBLE'],
        images: ['https://example.com/photo.jpg'],
        lastAvailabilityUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    beforeEach(async () => {
        mockPropertyModel = {
            aggregate: jest.fn().mockReturnValue({
                exec: jest.fn().mockImplementation(() => {
                    // Return results for data pipeline, and count for count pipeline
                    return Promise.resolve([mockAggregatedProperty]);
                }),
            }),
        };
        mockCollegesService = {
            findBySlug: jest.fn().mockResolvedValue(mockCollege),
            findById: jest.fn().mockResolvedValue(mockCollege),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                search_service_1.SearchService,
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
                {
                    provide: colleges_service_1.CollegesService,
                    useValue: mockCollegesService,
                },
            ],
        }).compile();
        service = module.get(search_service_1.SearchService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should execute $geoNear search when college is provided', async () => {
        const result = await service.search({
            college: 'amity-university-noida',
            radius: 3000,
            page: 1,
            limit: 10,
        });
        expect(mockCollegesService.findBySlug).toHaveBeenCalledWith('amity-university-noida');
        expect(mockPropertyModel.aggregate).toHaveBeenCalled();
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.name).toBe('Greenwood Student Residency');
        expect(result.data[0]?.distanceMeters).toBe(785);
        expect(result.data[0]?.startingRent).toBe(8500);
        expect(result.data[0]?.freshness).toBe(shared_types_1.AvailabilityFreshness.FRESH);
    });
});
//# sourceMappingURL=search.service.spec.js.map