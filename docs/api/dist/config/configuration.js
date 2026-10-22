"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    mongodbUri: process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.DATABASE_URL ||
        'mongodb://127.0.0.1:27017/apna_ghar',
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_min_32_characters_seed',
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_min_32_characters_seed',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_signing_secret',
    bedHoldDurationSeconds: parseInt(process.env.BED_HOLD_DURATION_SECONDS || '480', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    paymentKeyId: process.env.PAYMENT_KEY_ID || '',
    paymentKeySecret: process.env.PAYMENT_KEY_SECRET || 'dev_payment_secret_key_32_chars',
    paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'dev_payment_webhook_secret',
});
//# sourceMappingURL=configuration.js.map