import { MessService } from './mess.service';
import { CreateMessSubscriptionDto } from './dto/create-mess-subscription.dto';
import { UpdateWeeklyMenuDto } from './dto/update-weekly-menu.dto';
export declare class MessController {
    private readonly messService;
    constructor(messService: MessService);
    findAll(city?: string, dietaryType?: string): Promise<{
        success: boolean;
        data: import("./schemas/mess.schema").MessDocument[];
    }>;
    findBySlug(slug: string): Promise<{
        success: boolean;
        data: import("./schemas/mess.schema").MessDocument;
    }>;
    createSubscription(studentId: string, dto: CreateMessSubscriptionDto): Promise<{
        success: boolean;
        data: import("./schemas/mess-subscription.schema").MessSubscriptionDocument;
    }>;
    getStudentSubscriptions(studentId: string): Promise<{
        success: boolean;
        data: import("./schemas/mess-subscription.schema").MessSubscriptionDocument[];
    }>;
    getPartnerMess(partnerId: string): Promise<{
        success: boolean;
        data: import("./schemas/mess.schema").MessDocument | null;
    }>;
    updateWeeklyMenu(partnerId: string, messId: string, dto: UpdateWeeklyMenuDto): Promise<{
        success: boolean;
        data: import("./schemas/mess.schema").MessDocument;
    }>;
    getPartnerSubscribers(partnerId: string): Promise<{
        success: boolean;
        data: import("./schemas/mess-subscription.schema").MessSubscriptionDocument[];
    }>;
}
//# sourceMappingURL=mess.controller.d.ts.map