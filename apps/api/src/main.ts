import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for local Swagger documentation rendering
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Cookie Parser
  app.use(cookieParser(configService.get<string>('cookie.secret')));

  // 3. CORS Configuration
  const appUrl = configService.get<string>('appUrl') || 'http://localhost:3000';
  app.enableCors({
    origin: [appUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // 4. API Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // 5. Global Pipes, Filters & Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // 6. Swagger OpenAPI 3.0 Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Apna Ghar — API Specification')
    .setDescription(
      'Enterprise Backend API documentation for Apna Ghar student living and accommodation platform.\nTagline: "Har Safar, Apna Ghar"',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'User registration, login, session rotation, and logout')
    .addTag('Health', 'Infrastructure & system status check')
    .addTag('RBAC Verification Tests', 'Guards and role permission validation tests')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Enable graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 Apna Ghar API Gateway running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger Documentation active at: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🩺 Health Check available at: http://localhost:${port}/${apiPrefix}/health`);
}

bootstrap();
