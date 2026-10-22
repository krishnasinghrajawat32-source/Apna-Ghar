import { PricingService } from './pricing.service';
import { PropertiesService } from '../properties/properties.service';
export declare class PricingController {
    private readonly pricingService;
    private readonly propertiesService;
    constructor(pricingService: PricingService, propertiesService: PropertiesService);
    getCostBreakdown(propertyId: string, roomTypeId?: string): Promise<{
        success: boolean;
        data: import("./pricing.service").CostBreakdownResult;
    }>;
    getCostBreakdownBySlug(slug: string, roomTypeId?: string): Promise<{
        success: boolean;
        data: import("./pricing.service").CostBreakdownResult;
    }>;
}
//# sourceMappingURL=pricing.controller.d.ts.map