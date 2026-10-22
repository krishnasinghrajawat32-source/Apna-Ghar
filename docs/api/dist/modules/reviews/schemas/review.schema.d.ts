import { Document, Types } from 'mongoose';
import { ReviewStatus } from '@apna-ghar/shared-types';
export type ReviewDocument = Review & Document<Types.ObjectId>;
export declare class Review {
    propertyId: Types.ObjectId;
    studentId: Types.ObjectId;
    bookingId: Types.ObjectId;
    rating: number;
    cleanlinessRating: number;
    foodRating: number;
    safetyRating: number;
    comment: string;
    verifiedStay: boolean;
    status: ReviewStatus;
    moderationNote?: string;
}
export declare const ReviewSchema: import("mongoose").Schema<Review, import("mongoose").Model<Review, any, any, any, Document<unknown, any, Review, any, {}> & Review & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Review, Document<unknown, {}, import("mongoose").FlatRecord<Review>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Review> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=review.schema.d.ts.map