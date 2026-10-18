import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@apna-ghar/shared-types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: UserRole): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { userId: '123', role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are defined on the handler or class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    const context = createMockContext(UserRole.OWNER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has a different role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    const context = createMockContext(UserRole.STUDENT);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not present on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
