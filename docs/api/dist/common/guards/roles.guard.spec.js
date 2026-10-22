"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const roles_guard_1 = require("./roles.guard");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('RolesGuard', () => {
    let guard;
    let reflector;
    beforeEach(() => {
        reflector = new core_1.Reflector();
        guard = new roles_guard_1.RolesGuard(reflector);
    });
    const createMockContext = (userRole) => {
        return {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: userRole ? { userId: '123', role: userRole } : null,
                }),
            }),
        };
    };
    it('should allow access if no roles are defined on the handler or class', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
        const context = createMockContext();
        expect(guard.canActivate(context)).toBe(true);
    });
    it('should allow access if user has the required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([shared_types_1.UserRole.OWNER]);
        const context = createMockContext(shared_types_1.UserRole.OWNER);
        expect(guard.canActivate(context)).toBe(true);
    });
    it('should throw ForbiddenException if user has a different role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([shared_types_1.UserRole.OWNER]);
        const context = createMockContext(shared_types_1.UserRole.STUDENT);
        expect(() => guard.canActivate(context)).toThrow(common_1.ForbiddenException);
    });
    it('should throw ForbiddenException if user is not present on request', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([shared_types_1.UserRole.ADMIN]);
        const context = createMockContext();
        expect(() => guard.canActivate(context)).toThrow(common_1.ForbiddenException);
    });
});
//# sourceMappingURL=roles.guard.spec.js.map