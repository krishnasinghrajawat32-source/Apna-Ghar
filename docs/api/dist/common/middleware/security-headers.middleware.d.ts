import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    use(_req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=security-headers.middleware.d.ts.map