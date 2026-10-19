import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    // 1. Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' http://localhost:* https://* ws: wss:;",
    );

    // 2. Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // 3. MIME type sniffing protection
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 4. Strict Transport Security (HSTS)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

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
}
