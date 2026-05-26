import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('hydra-notify');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  // Internal service — CORS not needed, but restrict to loopback in production
  app.enableCors({ origin: false });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Hydra Notification Service')
      .setDescription(
        'Internal notification microservice — sends push notifications, ' +
          'admin alerts, and transactional emails. ' +
          'Consumed by hydra-be via API key.',
      )
      .setVersion('1.0')
      .addServer(`http://localhost:${process.env.PORT || 3005}`, 'Local development')
      .addApiKey({ type: 'apiKey', name: 'x-internal-key', in: 'header' }, 'x-internal-key')
      .addTag('App', 'Health and readiness checks')
      .addTag('Notifications', 'Push notification and email endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 3005;
  await app.listen(port, '0.0.0.0');
  logger.log(`hydra-notify running on port ${port}`);
}

bootstrap();
