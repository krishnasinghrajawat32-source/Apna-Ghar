import { UserRole } from '@apna-ghar/shared-types';
export interface AuthenticatedUser {
    userId: string;
    email: string;
    role: UserRole;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
//# sourceMappingURL=current-user.decorator.d.ts.map