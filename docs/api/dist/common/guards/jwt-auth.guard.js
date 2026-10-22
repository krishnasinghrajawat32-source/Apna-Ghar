"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const public_decorator_1 = require("../decorators/public.decorator");
const shared_constants_1 = require("@apna-ghar/shared-constants");
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    configService;
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException({
                code: shared_constants_1.ERROR_CODES.AUTH_UNAUTHORIZED,
                message: 'Authentication token missing or invalid.',
            });
        }
        try {
            const secret = this.configService.get('jwtAccessSecret') || 'dev_jwt_access_secret_min_32_characters_seed';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            request.user = {
                userId: decoded.sub,
                email: decoded.email,
                role: decoded.role,
            };
            return true;
        }
        catch (err) {
            const isExpired = err instanceof jsonwebtoken_1.default.TokenExpiredError;
            throw new common_1.UnauthorizedException({
                code: isExpired ? shared_constants_1.ERROR_CODES.AUTH_SESSION_EXPIRED : shared_constants_1.ERROR_CODES.AUTH_UNAUTHORIZED,
                message: isExpired ? 'Session expired. Please refresh your token.' : 'Invalid authentication token.',
            });
        }
    }
    extractToken(request) {
        const authHeader = request.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        if (request.cookies && request.cookies['accessToken']) {
            return request.cookies['accessToken'];
        }
        return null;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map