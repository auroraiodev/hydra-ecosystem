import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('SwaggerConfig');

export function setupSwagger(app: INestApplication): void {
  if (process.env.NODE_ENV !== 'development') {
    logger.log('Swagger disabled (NODE_ENV !== development)');
    return;
  }
  const config = new DocumentBuilder()
    .setTitle('Hydra BE API')
    .setDescription(
      `
    ## Hydra Backend API Documentation
    
    ### API Versioning
    This API supports versioning through multiple methods:
    - **URL Path**: \`/api/v1/users\`
    - **Header**: \`Api-Version: 1.0.0\`
    - **Query Parameter**: \`?v=1.0.0\`
    
    ### Standard Response Format
    All responses follow a consistent format:
    \`\`\`json
    {
      "success": true,
      "data": { ... },
      "meta": {
        "version": "v1.0.0",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "requestId": "req_1234567890_abc123"
      }
    }
    \`\`\`
    
    ### Error Handling
    Errors are returned with consistent structure:
    \`\`\`json
    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": { ... }
      },
      "meta": {
        "version": "v1.0.0",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "requestId": "req_1234567890_abc123"
      }
    }
    \`\`\`
    `,
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3002/api/v1', 'Development server - v1.0.0')
    .addServer('http://localhost:3002/api', 'Latest version')
    .addTag('users', 'User management operations')
    .addTag('auth', 'Authentication and authorization')
    .addTag('roles', 'Role-based access control')
    .addTag('listings', 'Product listings for sellers')
    .addTag('search', 'Search and filtering operations')
    .addTag('products', 'Product catalog management')
    .addTag('languages', 'Language configuration')
    .addTag('conditions', 'Card condition types')
    .addTag('categories', 'Product categories')
    .addTag('orders', 'Order management')
    .addTag('payments', 'Payment processing')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (format: Bearer <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Api-Version',
        in: 'header',
        description: 'API version (e.g., 1.0.0)',
      },
      'api-version',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      showRequestDuration: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      urls: [
        { url: '/docs-json', name: 'Core API' },
        { url: '/api/v1/catalog/docs-json', name: 'Catalog Service (REBUILT)' },
        { url: '/api/v1/commerce/docs-json', name: 'Commerce Service' },
        { url: '/api/v1/engage/docs-json', name: 'Engage Service' },
        { url: '/api/v1/admin-svc/docs-json', name: 'Admin Service' },
      ],
    },
    customSiteTitle: 'Hydra BE API Documentation',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-standalone-preset.js',
    ],
    customfavIcon: '/favicon.ico',
  });
}
