import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole, UserStatus } from '@apnaghar/shared-types';

describe('RolesGuard — RBAC Authorization Isolation Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny unauthenticated request when role is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STUDENT]);
    const context = createMockExecutionContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should DENY Student attempting to access Owner-only route (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    const studentUser = { id: 's1', role: UserRole.STUDENT, status: UserStatus.ACTIVE };
    const context = createMockExecutionContext(studentUser);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should DENY Student attempting to access Admin-only route (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const studentUser = { id: 's1', role: UserRole.STUDENT, status: UserStatus.ACTIVE };
    const context = createMockExecutionContext(studentUser);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should DENY Owner attempting to access Admin-only route (403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ownerUser = { id: 'o1', role: UserRole.OWNER, status: UserStatus.ACTIVE };
    const context = createMockExecutionContext(ownerUser);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should ALLOW Admin to access Admin-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const adminUser = { id: 'a1', role: UserRole.ADMIN, status: UserStatus.ACTIVE };
    const context = createMockExecutionContext(adminUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should ALLOW Student to access Student-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STUDENT]);
    const studentUser = { id: 's1', role: UserRole.STUDENT, status: UserStatus.ACTIVE };
    const context = createMockExecutionContext(studentUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should ALLOW Owner to access Owner-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);
    const ownerUser = { id: 'o1', role: UserRole.OWNER, status: UserStatus.ACTIVE };
    const context = createMockExecutionContext(ownerUser);

    expect(guard.canActivate(context)).toBe(true);
  });
});
