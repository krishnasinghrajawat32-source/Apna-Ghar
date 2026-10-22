export interface AppConfig {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    mongodbUri: string;
    redisUrl: string;
    jwtAccessSecret: string;
    jwtAccessExpiry: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiry: string;
    cookieSecret: string;
    bedHoldDurationSeconds: number;
    corsOrigin: string;
    paymentKeyId?: string;
    paymentKeySecret?: string;
    paymentWebhookSecret?: string;
}
declare const _default: () => AppConfig;
export default _default;
//# sourceMappingURL=configuration.d.ts.map