import { Model } from 'mongoose';
import { CollegesService } from '../colleges/colleges.service';
import { PropertyDocument } from '../properties/schemas/property.schema';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { AvailabilityFreshness } from '@apna-ghar/shared-types';
export interface PropertySearchResult {
    id: string;
    name: string;
    slug: string;
    propertyType: string;
    address: {
        street: string;
        city: string;
        state: string;
    };
    location: {
        type: string;
        coordinates: [number, number];
    };
    genderPreference: string;
    furnishing: string;
    isFullyVerified: boolean;
    distanceMeters?: number;
    startingRent: number;
    availableBedsCount: number;
    totalBedsCount: number;
    hasAc: boolean;
    hasFood: boolean;
    sharingTypes: string[];
    images: string[];
    freshness: AvailabilityFreshness;
    lastAvailabilityUpdatedAt: string;
}
export declare class SearchService {
    private readonly propertyModel;
    private readonly collegesService;
    private readonly logger;
    constructor(propertyModel: Model<PropertyDocument>, collegesService: CollegesService);
    search(dto: SearchPropertiesDto): Promise<{
        collegeAnchor: string | null;
        data: PropertySearchResult[];
        meta: {
            page: number;
            limit: number;
            total: any;
            hasNext: boolean;
        };
    }>;
}
//# sourceMappingURL=search.service.d.ts.map