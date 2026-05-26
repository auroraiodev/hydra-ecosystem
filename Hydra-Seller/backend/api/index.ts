import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from '../src/app.module';
import { setupCors } from '../src/config/cors.config';

const serverless = require('serverless-http');

let cachedHandler: any;
let bootstrapError: Error | null = null;

async function bootstrap() {
  if (bootstrapError) throw bootstrapError;
  if (cachedHandler) return cachedHandler;

  try {
    const expressApp = express();

    // Rewrite unversioned /auth/google* paths to /api/v1/auth/google* so they
    // match NestJS URI-versioned routes. This is needed because:
    //   - Google Cloud Console only allows registering the callback URL without
    //     the /api/v1 prefix (it's the registered OAuth redirect URI)
    //   - Frontends use `${AUTH_SERVICE_URL}/auth/google` for the initial redirect
    //   - NestJS versioning expects /api/v1/auth/google
    expressApp.use((req, _res, next) => {
      if (req.url.startsWith('/auth/google')) {
        req.url = '/api/v1' + req.url;
      }
      next();
    });

    const app = await NestFactory.create(
      AppModule,
      new (require('@nestjs/platform-express').ExpressAdapter)(expressApp),
      { logger: ['error', 'warn', 'log'] },
    );

    app.use(cookieParser());
    app.use(express.json({ limit: '100kb' }));
    app.use(express.urlencoded({ limit: '100kb', extended: true }));

    setupCors(app);
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    cachedHandler = serverless(expressApp);
    return cachedHandler;
  } catch (err) {
    bootstrapError = err instanceof Error ? err : new Error(String(err));
    console.error('[bootstrap] NestJS initialization failed:', bootstrapError);
    throw bootstrapError;
  }
}

export const handler = async (event: any, context: any) => {
  try {
    const handle = await bootstrap();
    return handle(event, context);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[handler] Fatal:', message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Service unavailable', message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
