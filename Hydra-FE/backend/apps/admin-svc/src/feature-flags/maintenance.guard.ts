import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FeatureFlagsService } from './feature-flags.service.js';

/**
 * Global guard that checks if the application is in maintenance mode.
 * Admins and Sellers can bypass maintenance mode to manage the platform.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
  private readonly logger = new Logger(MaintenanceGuard.name);

  constructor(
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // 1. Always allow these routes regardless of maintenance mode
    const isAllowedRoute =
      url.includes('/feature-flags') ||
      url.includes('/auth') ||
      url.includes('/health') ||
      url.includes('/terminus') ||
      url.includes('/admin/health');

    if (isAllowedRoute) {
      return true;
    }

    // 2. Check if maintenance mode is active
    const isMaintenanceModeActive = await this.featureFlagsService.get('maintenance_mode');

    // If not in maintenance mode, everyone can pass
    if (!isMaintenanceModeActive) {
      return true;
    }

    // 3. Maintenance mode is ON. Check if the user is an ADMIN or SELLER.
    let userRole: string | undefined;

    if (request.user && request.user.role) {
      userRole = request.user.role.name;
    }

    if (!userRole) {
      let token: string | undefined;

      if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        token = request.headers.authorization.split(' ')[1];
      } else if (request.cookies && request.cookies['__sid']) {
        token = request.cookies['__sid'];
      }

      if (token) {
        try {
          const payload = this.jwtService.verify(token);
          userRole = payload.role;

          if (!request.user) {
            request.user = {
              id: payload.sub,
              email: payload.email,
              role: { name: payload.role },
            };
          }
        } catch (error) {
          this.logger.debug(
            `Maintenance bypass: JWT verification failed for ${url}: ${error.message}`,
          );
        }
      }
    }

    // 4. If user is ADMIN or SELLER, they can bypass maintenance
    if (userRole === 'ADMIN' || userRole === 'SELLER') {
      this.logger.log(`Maintenance bypass allowed for ${userRole} on ${url}`);
      return true;
    }

    // 5. Block everyone else
    this.logger.warn(`Access denied due to maintenance mode: ${url}`);
    throw new ServiceUnavailableException({
      success: false,
      message:
        'El marketplace se encuentra en mantenimiento. Por favor, inténtalo de nuevo más tarde.',
      maintenance: true,
      code: 'MAINTENANCE_MODE',
    });
  }
}
