import { Document, Types } from 'mongoose';
import { DietaryType, MealType, DayOfWeek } from '@apna-ghar/shared-types';
export type MessDocument = Mess & Document<Types.ObjectId>;
export declare class MessAddress {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
}
export declare class OperatingHours {
    breakfast: string;
    lunch: string;
    dinner: string;
}
export declare class MealPlanSchema {
    id: string;
    name: string;
    mealTypes: MealType[];
    daysPerWeek: number;
    monthlyPrice: number;
    description?: string;
}
export declare class DailyMenuSchema {
    day: DayOfWeek;
    breakfast: string;
    lunch: string;
    snacks?: string;
    dinner: string;
    specialDietNote?: string;
}
export declare class Mess {
    partnerId: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    dietaryType: DietaryType;
    fssaiNumber: string;
    address: MessAddress;
    rating: number;
    hygieneCertified: boolean;
    operatingHours: OperatingHours;
    plans: MealPlanSchema[];
    weeklyMenu: DailyMenuSchema[];
    status: 'ACTIVE' | 'INACTIVE';
}
export declare const MessSchema: import("mongoose").Schema<Mess, import("mongoose").Model<Mess, any, any, any, Document<unknown, any, Mess, any, {}> & Mess & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Mess, Document<unknown, {}, import("mongoose").FlatRecord<Mess>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Mess> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=mess.schema.d.ts.map