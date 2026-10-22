import { Model, Types } from 'mongoose';
import { UserRole } from '@apna-ghar/shared-types';
import { UserDocument } from './schemas/user.schema';
import { StudentProfile, StudentProfileDocument } from './schemas/student-profile.schema';
import { OwnerProfileDocument } from './schemas/owner-profile.schema';
import { MessPartnerProfileDocument } from './schemas/mess-partner-profile.schema';
export declare class UsersService {
    private readonly userModel;
    private readonly studentProfileModel;
    private readonly ownerProfileModel;
    private readonly messPartnerProfileModel;
    constructor(userModel: Model<UserDocument>, studentProfileModel: Model<StudentProfileDocument>, ownerProfileModel: Model<OwnerProfileDocument>, messPartnerProfileModel: Model<MessPartnerProfileDocument>);
    create(data: {
        name: string;
        email: string;
        phone: string;
        passwordHash: string;
        role: UserRole;
    }): Promise<UserDocument>;
    findByEmail(email: string, includePassword?: boolean): Promise<UserDocument | null>;
    findById(id: string | Types.ObjectId, includeTokens?: boolean): Promise<UserDocument | null>;
    updateRefreshToken(id: string | Types.ObjectId, refreshTokenHash: string | null): Promise<void>;
    setResetPasswordToken(id: string | Types.ObjectId, resetPasswordTokenHash: string, resetPasswordExpires: Date): Promise<void>;
    findActivePasswordResetCandidates(): Promise<UserDocument[]>;
    resetPassword(id: string | Types.ObjectId, passwordHash: string): Promise<void>;
    getProfile(userId: string | Types.ObjectId, role: UserRole): Promise<{
        user: import("mongoose").FlattenMaps<UserDocument> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
        profile: unknown;
    }>;
    getRoommatePreferences(userId: string): Promise<import("./schemas/student-profile.schema").RoommatePreferences>;
    updateRoommatePreferences(userId: string, dto?: Partial<StudentProfile['roommatePreferences']>): Promise<import("./schemas/student-profile.schema").RoommatePreferences>;
}
//# sourceMappingURL=users.service.d.ts.map