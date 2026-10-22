import { GenderPreference, SharingType } from '@apna-ghar/shared-types';
export declare class SearchPropertiesDto {
    college?: string;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    gender?: GenderPreference;
    sharing?: SharingType;
    ac?: boolean;
    food?: boolean;
    verifiedOnly?: boolean;
    sort?: 'nearest' | 'lowest_rent' | 'recommended' | 'recently_updated';
    page?: number;
    limit?: number;
}
//# sourceMappingURL=search-properties.dto.d.ts.map