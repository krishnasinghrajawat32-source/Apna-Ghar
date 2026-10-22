"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityHeadersMiddleware = void 0;
const common_1 = require("@nestjs/common");
let SecurityHeadersMiddleware = class SecurityHeadersMiddleware {
    use(_req, res, next) {
        // 1. Content Security Policy
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' http://localhost:* https://* ws: wss:;");
        // 2. Prevent clickjacking
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        // 3. MIME type sniffing protection
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // 4. Strict Transport Security (HSTS)
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        // 5. Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        // 6. X-XSS-Protection (legacy browsers)
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // 7. Permissions Policy
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        // 8. Prevent IE from opening downloads in site context
        res.setHeader('X-Download-Options', 'noopen');
        // 9. Cross Domain Policies
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        next();
    }
};
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware;
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware = __decorate([
    (0, common_1.Injectable)()
], SecurityHeadersMiddleware);
//# sourceMappingURL=security-headers.middleware.js.map