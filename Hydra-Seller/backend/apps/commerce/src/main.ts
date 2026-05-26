import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CommerceModule } from './commerce.module.js';

async function bootstrap() {
  const app = await NestFactory.create(CommerceModule);
  const logger = new Logger('CommerceBootstrap');

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Hydra Commerce Service')
    .setDescription('Microservice for orders, payments, and carts')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3011;
  await app.listen(port, '0.0.0.0');
  logger.log(`Hydra Commerce Service running on: http://0.0.0.0:${port}`);
}

void bootstrap();
