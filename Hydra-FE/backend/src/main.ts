import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException, Logger, VersioningType } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module.js';
import { setupSwagger } from './config/swagger.config.js';
import { setupCors } from './config/cors.config.js';
import { setupSecurity } from './config/security.config.js';

function validateRequiredEnvVars() {
  const required: string[] = ['JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Application cannot start.`,
    );
  }
}

async function bootstrap() {
  validateRequiredEnvVars();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(express()));

  // Cookie parser must be registered before guards that read cookies
  app.use(cookieParser());

  // Request body size limits (prevent DoS via large payloads)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  // Serve local uploads directory (fallback when S3 is not configured)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (error) {
    new Logger('Bootstrap').warn(
      `Could not create local uploads directory: ${error.message} — local file uploads may not function correctly.`,
    );
  }
  app.use('/uploads', express.static(uploadsDir));

  // Security headers before anything else
  setupSecurity(app);

  // Enable CORS (before global prefix)
  setupCors(app);

  // Swagger: guard is inside setupSwagger (development only)
  setupSwagger(app);

  // Set global prefix AFTER Swagger setup
  app.setGlobalPrefix('api');

  // Enable URI versioning (e.g. /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable validation pipe globally
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formattedErrors = validationErrors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
          receivedValue: error.value,
        }));

        try {
          fs.writeFileSync(
            path.join(process.cwd(), 'validation_errors.log'),
            JSON.stringify(formattedErrors, null, 2),
          );
          fs.writeFileSync(
            path.join(process.cwd(), 'validation_raw.log'),
            JSON.stringify(validationErrors, null, 2),
          );
        } catch (_e) {
          // Ignore write errors
        }

        logger.error(`[Validation Error] ${JSON.stringify(formattedErrors, null, 2)}`);

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    }),
  );

  const port = process.env.BACKEND_PORT ?? process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0');
  logger.log(`Hydra Backend running on: http://0.0.0.0:${port}`);
}
void bootstrap();
