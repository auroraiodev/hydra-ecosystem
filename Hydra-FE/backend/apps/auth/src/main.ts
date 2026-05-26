import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      process.env.HYDRA_FE_URL || 'http://localhost:3000',
      process.env.HYDRA_ADMIN_URL || 'http://localhost:3001',
      process.env.HYDRA_SELLER_URL || 'http://localhost:3003',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Hydra Auth Service')
      .setDescription(
        'Authentication microservice — Google OAuth 2.0 login, JWT issuance, and session management. ' +
          'Consumed by hydra-fe, hydra-admin, hydra-seller, and hydra-be.',
      )
      .setVersion('1.0')
      .addServer(`http://localhost:${process.env.PORT || 3004}`, 'Local development')
      .addTag('App', 'Health and readiness checks')
      .addTag('Auth', 'Authentication endpoints — Google OAuth flow')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3004;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Hydra Auth service running on port ${port}`);
}
bootstrap();
