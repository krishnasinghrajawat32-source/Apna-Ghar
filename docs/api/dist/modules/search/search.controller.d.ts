import { SearchService } from './search.service';
import { SearchPropertiesDto } from './dto/search-properties.dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(dto: SearchPropertiesDto): Promise<{
        data: import("./search.service").PropertySearchResult[];
        meta: {
            collegeAnchor: string | null;
            page: number;
            limit: number;
            total: any;
            hasNext: boolean;
        };
    }>;
}
//# sourceMappingURL=search.controller.d.ts.map