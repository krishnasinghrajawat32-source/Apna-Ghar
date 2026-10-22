import { Document, Types } from 'mongoose';
import { GenderPreference } from '@apna-ghar/shared-types';
export type StudentProfileDocument = StudentProfile & Document<Types.ObjectId>;
export declare class EmergencyContact {
    name: string;
    phone: string;
    relation: string;
}
export declare class RoommatePreferences {
    sleepSchedule: 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE';
    foodPreference: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGGETARIAN' | 'ANY';
    cleanlinessLevel: 'STRICT' | 'MODERATE' | 'CASUAL';
    studyHabits: 'SILENT' | 'GROUP' | 'MUSIC_OK';
    smoking: boolean;
    hobbies: string[];
}
export declare class StudentProfile {
    userId: Types.ObjectId;
    collegeId?: Types.ObjectId | null;
    gender?: GenderPreference | null;
    course?: string;
    yearOfStudy?: number;
    emergencyContact?: EmergencyContact;
    roommatePreferences?: RoommatePreferences;
}
export declare const StudentProfileSchema: import("mongoose").Schema<StudentProfile, import("mongoose").Model<StudentProfile, any, any, any, Document<unknown, any, StudentProfile, any, {}> & StudentProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StudentProfile, Document<unknown, {}, import("mongoose").FlatRecord<StudentProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<StudentProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=student-profile.schema.d.ts.map