import { Document, Types } from 'mongoose';
import { VerificationType, VerificationStatus } from '@apna-ghar/shared-types';
export type TrustPassportDocument = TrustPassport & Document<Types.ObjectId>;
export declare class CheckpointItem {
    type: VerificationType;
    status: VerificationStatus;
    verifiedAt?: Date;
    expiresAt?: Date;
    notes?: string;
    verifiedBy?: Types.ObjectId;
}
export declare class TrustPassport {
    propertyId: Types.ObjectId;
    isFullyVerified: boolean;
    score: number;
    lastVerifiedAt?: Date;
    checkpoints: CheckpointItem[];
}
export declare const TrustPassportSchema: import("mongoose").Schema<TrustPassport, import("mongoose").Model<TrustPassport, any, any, any, Document<unknown, any, TrustPassport, any, {}> & TrustPassport & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TrustPassport, Document<unknown, {}, import("mongoose").FlatRecord<TrustPassport>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<TrustPassport> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=trust-passport.schema.d.ts.map