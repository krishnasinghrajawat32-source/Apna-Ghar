import { UsersService } from './users.service';
import { UpdateRoommatePreferencesDto } from './dto/update-roommate-preferences.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getRoommatePreferences(userId: string): Promise<{
        success: boolean;
        data: import("./schemas/student-profile.schema").RoommatePreferences;
    }>;
    updateRoommatePreferences(userId: string, dto: UpdateRoommatePreferencesDto): Promise<{
        success: boolean;
        data: import("./schemas/student-profile.schema").RoommatePreferences;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map