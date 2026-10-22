import { Document, Types } from 'mongoose';
import { PropertyType, GenderPreference, FurnishingType, PropertyStatus } from '@apna-ghar/shared-types';
export type PropertyDocument = Property & Document<Types.ObjectId>;
export declare class PropertyGeoLocation {
    type: string;
    coordinates: [number, number];
}
export declare class PropertyAddress {
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
}
export declare class Property {
    ownerId: Types.ObjectId;
    name: string;
    slug: string;
    propertyType: PropertyType;
    description: string;
    address: PropertyAddress;
    location: PropertyGeoLocation;
    genderPreference: GenderPreference;
    furnishing: FurnishingType;
    status: PropertyStatus;
    amenities: string[];
    rules: string[];
    images: string[];
    isFullyVerified: boolean;
    rating: number;
    reviewCount: number;
    lastAvailabilityUpdatedAt: Date;
}
export declare const PropertySchema: import("mongoose").Schema<Property, import("mongoose").Model<Property, any, any, any, Document<unknown, any, Property, any, {}> & Property & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Property, Document<unknown, {}, import("mongoose").FlatRecord<Property>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Property> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=property.schema.d.ts.map