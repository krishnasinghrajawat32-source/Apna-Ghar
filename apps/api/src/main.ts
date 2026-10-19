import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

async function bootstrap() {
  const logger = new Logger('ApnaGharAPI');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
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
    origin: [corsOrigin, 'http://localhost:3000'],
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

  await app.listen(port);
  logger.log(`Apna Ghar Backend API listening on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger OpenAPI documentation: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
