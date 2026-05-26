import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly securityHeaders: SecurityHeaders = {
    'Content-Security-Policy': this.buildCSP(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': this.buildPermissionsPolicy(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };

  use(req: Request, res: Response, next: NextFunction): void {
    // Apply security headers
    Object.entries(this.securityHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });

    // Remove sensitive server information
    res.removeHeader('X-Powered-By');

    // Add request ID for tracking
    res.setHeader('X-Request-ID', req.requestId || 'unknown');

    next();
  }

  private buildCSP(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.mercadopago.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ];

    return directives.join('; ');
  }

  private buildPermissionsPolicy(): string {
    const permissions = [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ];

    return permissions.join(', ');
  }
}
