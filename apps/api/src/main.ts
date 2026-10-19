import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

async function bootstrap() {
  const logger = new Logger('ApnaGharAPI');

  // Detect port and host immediately (Render injects PORT=10000)
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = '0.0.0.0';

  // 1. Create native Express app and HTTP server to bind port immediately
  const expressApp = express();
  const httpServer = http.createServer(expressApp);

  // Early liveness & readiness probes so Render port scan passes immediately
  expressApp.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Apna Ghar API',
      status: 'online',
      tagline: 'Har Sahar Apna Ghar — Trust-First Student Accommodation Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  expressApp.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Bind port immediately so Render port scan passes in <1s
  await new Promise<void>((resolve) => {
    httpServer.listen(port, host, () => {
      logger.log(`⚡ Early HTTP listener bound on http://${host}:${port} for cloud port detection`);
      resolve();
    });
  });

  // 2. Initialize NestJS application on top of the already-listening express server
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
    abortOnError: false,
  });

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('corsOrigin') || 'http://localhost:3000';
  const cookieSecret = configService.get<string>('cookieSecret') || 'apna_ghar_secret';

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Apply enterprise security headers
  const securityMiddleware = new SecurityHeadersMiddleware();
  app.use((req: any, res: any, next: any) => securityMiddleware.use(req, res, next));

  // Global URL prefix
  app.setGlobalPrefix(apiPrefix);

  // Security & Cookies
  app.use(cookieParser(cookieSecret));

  // CORS
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

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Apna Ghar API')
    .setDescription('Production REST API for Apna Ghar — Trust-First Student Accommodation Platform')
    .setVersion('1.0.0')
    .addTag('Health', 'Liveness and Readiness Probes')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.init();
  logger.log(`✅ Apna Ghar Backend API fully mounted on http://${host}:${port}/${apiPrefix}`);
  logger.log(`Swagger OpenAPI documentation: http://${host}:${port}/${apiPrefix}/docs`);
}

bootstrap().catch((err) => {
  console.error('[ApnaGharAPI] Bootstrap critical error:', err);
});
