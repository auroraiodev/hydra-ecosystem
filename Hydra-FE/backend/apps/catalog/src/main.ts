import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger, VersioningType } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CatalogModule } from './catalog.module.js';

function validateRequiredEnvVars() {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  validateRequiredEnvVars();

  const app = await NestFactory.create(CatalogModule);
  const logger = new Logger('CatalogBootstrap');

  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Hydra Catalog Service (LATEST)')
    .setDescription('Microservice for product catalog, TCGs, and search')
    .setVersion('1.0.1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formatted = errors.map((e) => ({ property: e.property, constraints: e.constraints }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formatted,
        });
      },
    }),
  );

  const port = process.env.PORT ?? 3010;
  await app.listen(port, '0.0.0.0');
  logger.log(`Hydra Catalog Service running on: http://0.0.0.0:${port}`);
}

// Trigger watch restart
void bootstrap();
