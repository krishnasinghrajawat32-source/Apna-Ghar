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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const argon2 = __importStar(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const users_service_1 = require("../users/users.service");
const shared_constants_1 = require("@apna-ghar/shared-constants");
let AuthService = class AuthService {
    usersService;
    configService;
    constructor(usersService, configService) {
        this.usersService = usersService;
        this.configService = configService;
    }
    async register(dto) {
        const passwordHash = await argon2.hash(dto.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });
        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            role: dto.role,
        });
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
        await this.persistRefreshToken(user._id.toString(), tokens.refreshToken);
        return {
            user: user.toJSON(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email, true);
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_INVALID_CREDENTIALS,
                message: 'Invalid email address or password.',
            });
        }
        const isMatch = await argon2.verify(user.passwordHash, dto.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_INVALID_CREDENTIALS,
                message: 'Invalid email address or password.',
            });
        }
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
        await this.persistRefreshToken(user._id.toString(), tokens.refreshToken);
        return {
            user: user.toJSON(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
    }
    async refreshToken(rawToken) {
        if (!rawToken) {
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_UNAUTHORIZED,
                message: 'Refresh token is required.',
            });
        }
        const refreshSecret = this.configService.get('jwtRefreshSecret') || 'dev_jwt_refresh_secret_min_32_characters_seed';
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(rawToken, refreshSecret);
        }
        catch {
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_SESSION_EXPIRED,
                message: 'Refresh session expired or invalid. Please log in again.',
            });
        }
        const user = await this.usersService.findById(payload.sub, true);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_UNAUTHORIZED,
                message: 'Session has been invalidated. Please log in again.',
            });
        }
        const isTokenValid = await argon2.verify(user.refreshTokenHash, rawToken);
        if (!isTokenValid) {
            // Possible reuse attack: revoke refresh token
            await this.usersService.updateRefreshToken(user._id, null);
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_UNAUTHORIZED,
                message: 'Session revoked. Please log in again.',
            });
        }
        // Token rotation: Issue fresh access AND refresh token
        const newTokens = await this.generateTokens(user._id.toString(), user.email, user.role);
        await this.persistRefreshToken(user._id.toString(), newTokens.refreshToken);
        return {
            user: user.toJSON(),
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
        };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (user) {
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenHash = await argon2.hash(resetToken, { type: argon2.argon2id });
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await this.usersService.setResetPasswordToken(user._id, resetTokenHash, expiresAt);
            // In production, send via email provider. In dev, log token for testing.
            if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.info(`[Dev Password Reset] Token for ${email}: ${resetToken}`);
            }
        }
        return {
            message: 'If an account exists with this email address, password reset instructions have been dispatched.',
        };
    }
    async resetPassword(dto) {
        const candidates = await this.usersService.findActivePasswordResetCandidates();
        let matchedUser = null;
        for (const candidate of candidates) {
            if (candidate.resetPasswordTokenHash) {
                const isMatch = await argon2.verify(candidate.resetPasswordTokenHash, dto.token);
                if (isMatch) {
                    matchedUser = candidate;
                    break;
                }
            }
        }
        if (!matchedUser) {
            throw new common_1.BadRequestException({
                code: shared_constants_1.ERROR_CODES.VALIDATION_ERROR,
                message: 'Invalid or expired password reset token.',
            });
        }
        const newPasswordHash = await argon2.hash(dto.newPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });
        await this.usersService.resetPassword(matchedUser._id, newPasswordHash);
        return {
            message: 'Password has been successfully reset. You may now log in with your new credentials.',
        };
    }
    async generateTokens(userId, email, role) {
        const accessSecret = this.configService.get('jwtAccessSecret') || 'dev_jwt_access_secret_min_32_characters_seed';
        const refreshSecret = this.configService.get('jwtRefreshSecret') || 'dev_jwt_refresh_secret_min_32_characters_seed';
        const accessExpiry = this.configService.get('jwtAccessExpiry') || '15m';
        const refreshExpiry = this.configService.get('jwtRefreshExpiry') || '7d';
        const accessToken = jsonwebtoken_1.default.sign({ sub: userId, email, role }, accessSecret, { expiresIn: accessExpiry });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, jti: crypto_1.default.randomUUID() }, refreshSecret, { expiresIn: refreshExpiry });
        return { accessToken, refreshToken };
    }
    async persistRefreshToken(userId, refreshToken) {
        const tokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
        await this.usersService.updateRefreshToken(userId, tokenHash);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map