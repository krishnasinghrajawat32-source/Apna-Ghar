import { Document, Types } from 'mongoose';
import { UserRole, UserStatus } from '@apna-ghar/shared-types';
export type UserDocument = User & Document<Types.ObjectId>;
export declare class User {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    refreshTokenHash?: string | null;
    resetPasswordTokenHash?: string | null;
    resetPasswordExpires?: Date | null;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=user.schema.d.ts.map