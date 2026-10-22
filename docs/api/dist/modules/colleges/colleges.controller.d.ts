import { CollegesService } from './colleges.service';
export declare class CollegesController {
    private readonly collegesService;
    constructor(collegesService: CollegesService);
    search(query?: string, limit?: number): Promise<(import("mongoose").FlattenMaps<any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findBySlug(slug: string): Promise<import("mongoose").FlattenMaps<any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
//# sourceMappingURL=colleges.controller.d.ts.map