import { OnModuleInit } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { CollegeDocument } from './schemas/college.schema';
export declare class CollegesService implements OnModuleInit {
    private readonly collegeModel;
    private readonly logger;
    constructor(collegeModel: Model<CollegeDocument>);
    onModuleInit(): Promise<void>;
    search(query: string, limit?: number): Promise<CollegeDocument[]>;
    findBySlug(slug: string): Promise<CollegeDocument>;
    findById(id: string | Types.ObjectId): Promise<CollegeDocument>;
    private seedInitialColleges;
}
//# sourceMappingURL=colleges.service.d.ts.map