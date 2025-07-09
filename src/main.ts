import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from '@presentation/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { LoggerService } from '@infrastructure/logger/logger.service';
import * as cookieParser from 'cookie-parser';

// Modules
import * as Modules from '@presentation/modules';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = await app.resolve(LoggerService);

  logger.setContext('Application');

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cookie Parser
  app.use(cookieParser());

  // Global exception filter
  const exceptionLogger = await app.resolve(LoggerService);
  app.useGlobalFilters(new AllExceptionsFilter(exceptionLogger));

  // Enable CORS with security settings
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Get i18n service to use in Swagger
  const i18nService = app.get(ConfigService).get('i18n');
  const supportedLanguages = i18nService?.supportedLocales || ['en', 'ar'];

  // Swagger setup
  const configV1 = new DocumentBuilder()
    .setTitle('NestJS Clean Architecture API')
    .setDescription('The API documentation for the NestJS Clean Architecture template')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('roles', 'Role management endpoints')
    .addTag('admin', 'Admin endpoints')
    .addGlobalParameters({
      name: 'Accept-Language',
      in: 'header',
      required: false,
      schema: {
        type: 'string',
        default: 'en',
        enum: supportedLanguages,
        example: 'en',
        description: 'Language preference for the response',
      },
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This is a key to be used in @ApiBearerAuth() decorator
    )
    .build();

  // Basic Auth for Swagger (only in production)
  if (configService.get<string>('NODE_ENV') === 'production') {
    app.use(
      '/docs',
      basicAuth({
        challenge: true,
        users: {
          [configService.get<string>('SWAGGER_USER', 'admin')]: configService.get<string>(
            'SWAGGER_PASSWORD',
            'admin',
          ),
        },
      }),
    );
  }

  const documentV1 = SwaggerModule.createDocument(app, configV1, {
    include: [
      Modules.AdminModule,
      Modules.AuthV1Module,
      Modules.HealthModule,
      Modules.RoleModule,
      Modules.StorageModule,
      Modules.UserModule,
    ],
  });

  SwaggerModule.setup('docs', app, documentV1, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      urls: [
        {
          name: 'Api V1',
          url: 'docs/v1/swagger.json',
        },
        {
          name: 'Api V2',
          url: 'docs/v2/swagger.json',
        },
      ],
    },
    customSiteTitle: 'NestJS Clean Architecture API',
    jsonDocumentUrl: '/docs/v1/swagger.json',
  });

  const configV2 = new DocumentBuilder()
    .setTitle('NestJS Clean Architecture API')
    .setDescription('The API documentation for the NestJS Clean Architecture template')
    .setVersion('2.0')
    .addTag('auth', 'Authentication endpoints')
    .addGlobalParameters({
      name: 'Accept-Language',
      in: 'header',
      required: false,
      schema: {
        type: 'string',
        default: 'en',
        enum: supportedLanguages,
        example: 'en',
        description: 'Language preference for the response',
      },
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This is a key to be used in @ApiBearerAuth() decorator
    )
    .build();

  const documentV2 = SwaggerModule.createDocument(app, configV2, {
    include: [Modules.AuthV2Module],
  });

  SwaggerModule.setup('docs/v2', app, documentV2, {
    jsonDocumentUrl: '/docs/v2/swagger.json',
  });

  // Start server
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  await app.listen(port);
  const appUrl = await app.getUrl();

  logger.log({
    message: 'Application started',
    port,
    environment: nodeEnv,
    url: appUrl,
  });

  logger.log({
    message: 'Swagger documentation available',
    url: `${appUrl}/docs`,
  });
}

bootstrap().catch(err => {
  console.error('Error starting application:', err);
  process.exit(1);
});
