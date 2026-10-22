"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const shared_types_1 = require("@apna-ghar/shared-types");
const shared_constants_1 = require("@apna-ghar/shared-constants");
describe('AuthService', () => {
    let authService;
    let mockUsersService;
    const mockUser = {
        _id: '651a1a2b3c4d5e6f7a8b9c0f',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+919876543210',
        passwordHash: '',
        role: shared_types_1.UserRole.STUDENT,
        status: shared_types_1.UserStatus.ACTIVE,
        emailVerified: false,
        phoneVerified: false,
        toJSON: () => ({
            id: '651a1a2b3c4d5e6f7a8b9c0f',
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: '+919876543210',
            role: shared_types_1.UserRole.STUDENT,
            status: shared_types_1.UserStatus.ACTIVE,
            emailVerified: false,
            phoneVerified: false,
        }),
    };
    beforeAll(async () => {
        mockUser.passwordHash = await argon2.hash('SecurePassword123', { type: argon2.argon2id });
    });
    beforeEach(async () => {
        mockUsersService = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            updateRefreshToken: jest.fn().mockResolvedValue(undefined),
            setResetPasswordToken: jest.fn().mockResolvedValue(undefined),
            resetPassword: jest.fn().mockResolvedValue(undefined),
            findActivePasswordResetCandidates: jest.fn().mockResolvedValue([]),
        };
        const mockConfigService = {
            get: jest.fn((key) => {
                if (key === 'jwtAccessSecret')
                    return 'test_access_secret_super_secure_key_123';
                if (key === 'jwtRefreshSecret')
                    return 'test_refresh_secret_super_secure_key_123';
                if (key === 'jwtAccessExpiry')
                    return '15m';
                if (key === 'jwtRefreshExpiry')
                    return '7d';
                return null;
            }),
        };
        const moduleRef = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: users_service_1.UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        authService = moduleRef.get(auth_service_1.AuthService);
    });
    describe('Registration', () => {
        it('should register a new student and return user and tokens', async () => {
            mockUsersService.create.mockResolvedValue(mockUser);
            const result = await authService.register({
                name: 'Rahul Sharma',
                email: 'rahul.sharma@example.com',
                phone: '+919876543210',
                password: 'SecurePassword123',
                role: shared_types_1.UserRole.STUDENT,
            });
            expect(mockUsersService.create).toHaveBeenCalled();
            expect(result.user.email).toBe('rahul.sharma@example.com');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(mockUsersService.updateRefreshToken).toHaveBeenCalled();
        });
        it('should reject duplicate email registration', async () => {
            mockUsersService.create.mockRejectedValue(new common_1.ConflictException({
                code: shared_constants_1.ERROR_CODES.AUTH_EMAIL_EXISTS,
                message: 'An account with this email address already exists.',
            }));
            await expect(authService.register({
                name: 'Rahul Sharma',
                email: 'rahul.sharma@example.com',
                phone: '+919876543210',
                password: 'SecurePassword123',
                role: shared_types_1.UserRole.STUDENT,
            })).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('Login', () => {
        it('should authenticate user with valid credentials', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            const result = await authService.login({
                email: 'rahul.sharma@example.com',
                password: 'SecurePassword123',
            });
            expect(result.user.email).toBe('rahul.sharma@example.com');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });
        it('should reject login with wrong password', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            await expect(authService.login({
                email: 'rahul.sharma@example.com',
                password: 'WrongPassword999',
            })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should reject login when user does not exist', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            await expect(authService.login({
                email: 'nonexistent@example.com',
                password: 'SecurePassword123',
            })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('Logout', () => {
        it('should clear refresh token on logout', async () => {
            await authService.logout('651a1a2b3c4d5e6f7a8b9c0f');
            expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith('651a1a2b3c4d5e6f7a8b9c0f', null);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map