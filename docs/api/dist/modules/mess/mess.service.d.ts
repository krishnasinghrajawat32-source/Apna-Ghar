import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { MessDocument } from './schemas/mess.schema';
import { MessSubscriptionDocument } from './schemas/mess-subscription.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateMessSubscriptionDto } from './dto/create-mess-subscription.dto';
import { DailyMenu } from '@apna-ghar/shared-types';
export declare class MessService implements OnModuleInit {
    private readonly messModel;
    private readonly subscriptionModel;
    private readonly userModel;
    private readonly logger;
    constructor(messModel: Model<MessDocument>, subscriptionModel: Model<MessSubscriptionDocument>, userModel: Model<UserDocument>);
    onModuleInit(): Promise<void>;
    private generateSubscriptionNumber;
    private seedInitialMesses;
    findAll(query?: {
        city?: string;
        dietaryType?: string;
    }): Promise<MessDocument[]>;
    findBySlug(slug: string): Promise<MessDocument>;
    getPartnerMess(partnerId: string): Promise<MessDocument | null>;
    updateWeeklyMenu(partnerId: string, messId: string, weeklyMenu: DailyMenu[]): Promise<MessDocument>;
    createSubscription(studentId: string, dto: CreateMessSubscriptionDto): Promise<MessSubscriptionDocument>;
    getStudentSubscriptions(studentId: string): Promise<MessSubscriptionDocument[]>;
    getPartnerSubscriptions(partnerId: string): Promise<MessSubscriptionDocument[]>;
}
//# sourceMappingURL=mess.service.d.ts.map