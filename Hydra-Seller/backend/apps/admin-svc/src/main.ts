import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AdminSvcModule } from './admin-svc.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AdminSvcModule);
  const logger = new Logger('AdminSvcBootstrap');

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hydra Admin Service')
    .setDescription('Microservice for merchant and admin operations')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3013;
  await app.listen(port, '0.0.0.0');
  logger.log(`Hydra Admin Service running on: http://0.0.0.0:${port}`);
}

// Trigger watch restart
void bootstrap();
