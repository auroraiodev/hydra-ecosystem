import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is required');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(express()));

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // CORS — allow Shop, Admin, Seller frontends
  const origins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.SELLER_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3003',
  ].filter(Boolean) as string[];

  app.enableCors({ origin: origins, credentials: true });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Hydra Chat Service')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.PORT ?? 3007;
  await app.listen(port, '0.0.0.0');
  logger.log(`Hydra Chat running on :${port}`);
}
void bootstrap();
