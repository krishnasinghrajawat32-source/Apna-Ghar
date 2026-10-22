"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const security_headers_middleware_1 = require("./common/middleware/security-headers.middleware");
async function bootstrap() {
    const logger = new common_1.Logger('ApnaGharAPI');
    // 1. Create standard NestJS application
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = Number(process.env.PORT ?? configService.get('port') ?? 4000);
    const apiPrefix = configService.get('apiPrefix') || 'api/v1';
    const corsOrigin = configService.get('corsOrigin') || 'http://localhost:3000';
    const cookieSecret = configService.get('cookieSecret') || 'apna_ghar_secret';
    // Enable graceful shutdown hooks
    app.enableShutdownHooks();
    // Apply enterprise security headers
    const securityMiddleware = new security_headers_middleware_1.SecurityHeadersMiddleware();
    app.use((req, res, next) => securityMiddleware.use(req, res, next));
    // Global URL prefix: Route all controllers under /api/v1 while allowing root '/'
    app.setGlobalPrefix(apiPrefix, {
        exclude: ['/'],
    });
    // Root /health endpoint for cloud port-scanners and load balancers
    const expressInstance = app.getHttpAdapter().getInstance();
    expressInstance.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            message: 'Apna Ghar Backend API is operational. For full database & cache health, visit /api/v1/health',
            timestamp: new Date().toISOString(),
        });
    });
    // Security & Cookies
    app.use((0, cookie_parser_1.default)(cookieSecret));
    // CORS: Allow Vercel production frontend, local frontend, and configured origin
    app.enableCors({
        origin: [
            corsOrigin,
            'https://apna-ghar-xgqu.vercel.app',
            'http://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    // Global Validation Pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    // Global Filters & Interceptors
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    // Swagger OpenAPI Documentation mapped at /api/v1/docs
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Apna Ghar API')
        .setDescription('Production REST API for Apna Ghar — Trust-First Student Accommodation Platform')
        .setVersion('1.0.0')
        .addTag('Health', 'Liveness and Readiness Probes')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    // 2. Listen directly on Render's assigned port and 0.0.0.0
    await app.listen(port, '0.0.0.0');
    logger.log(`Apna Ghar Backend API listening on: http://0.0.0.0:${port}/${apiPrefix}`);
    logger.log(`Swagger OpenAPI documentation: http://0.0.0.0:${port}/${apiPrefix}/docs`);
}
bootstrap().catch((err) => {
    console.error('[ApnaGharAPI] Bootstrap critical error:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map