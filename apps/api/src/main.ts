import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

async function bootstrap() {
  const logger = new Logger('ApnaGharAPI');

  // 1. Create standard NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = Number(process.env.PORT ?? configService.get<number>('port') ?? 4000);
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('corsOrigin') || 'http://localhost:3000';
  const cookieSecret = configService.get<string>('cookieSecret') || 'apna_ghar_secret';

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Apply enterprise security headers
  const securityMiddleware = new SecurityHeadersMiddleware();
  app.use((req: any, res: any, next: any) => securityMiddleware.use(req, res, next));

  // Global URL prefix: Route all controllers under /api/v1 while allowing root '/'
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: '', method: RequestMethod.GET },
    ],
  });

  // Root /health endpoint for cloud port-scanners and load balancers
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.get('/health', (_req: any, res: any) => {
    res.status(200).json({
      status: 'ok',
      message: 'Apna Ghar Backend API is operational. For full database & cache health, visit /api/v1/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Security & Cookies
  app.use(cookieParser(cookieSecret));

  // CORS: Allow Vercel production frontend, local frontend, LAN IPs, and configured origin
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== 'production') {
        const isLocalOrLan =
          /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
            origin,
          );
        if (isLocalOrLan) {
          return callback(null, true);
        }
      }

      const allowedOrigins = [
        corsOrigin,
        'https://apna-ghar-mauve.vercel.app',
        'https://apna-ghar-xgqu.vercel.app',
        'http://localhost:3000',
      ];

      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger OpenAPI Documentation mapped at /api/v1/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Apna Ghar API')
    .setDescription('Production REST API for Apna Ghar — Trust-First Student Accommodation Platform')
    .setVersion('1.0.0')
    .addTag('Health', 'Liveness and Readiness Probes')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // 2. Listen directly on Render's assigned port and 0.0.0.0
  await app.listen(port, '0.0.0.0');
  logger.log(`Apna Ghar Backend API listening on: http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`Swagger OpenAPI documentation: http://0.0.0.0:${port}/${apiPrefix}/docs`);
}

bootstrap().catch((err) => {
  console.error('[ApnaGharAPI] Bootstrap critical error:', err);
  process.exit(1);
});
