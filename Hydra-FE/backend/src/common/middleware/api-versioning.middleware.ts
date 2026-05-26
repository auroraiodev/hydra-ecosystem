import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

export interface ApiVersion {
  major: number;
  minor: number;
  patch: number;
}

@Injectable()
export class ApiVersioningMiddleware implements NestMiddleware {
  private readonly defaultVersion: ApiVersion = { major: 1, minor: 0, patch: 0 };
  private readonly supportedVersions: ApiVersion[] = [{ major: 1, minor: 0, patch: 0 }];

  use(req: Request, res: Response, next: NextFunction) {
    const version = this.extractVersion(req);

    if (!this.isVersionSupported(version)) {
      return res.status(400).json({
        error: 'Unsupported API version',
        message: `Version ${this.formatVersion(version)} is not supported`,
        supportedVersions: this.supportedVersions.map((v) => this.formatVersion(v)),
      });
    }

    req.apiVersion = version;
    req.versionedPath = this.buildVersionedPath(req.path, version);

    next();
  }

  private extractVersion(req: Request): ApiVersion {
    // Check version from header first
    const headerVersion = req.headers['api-version'] as string;
    if (headerVersion) {
      return this.parseVersion(headerVersion);
    }

    // Check version from query parameter
    const queryVersion = req.query['v'] as string;
    if (queryVersion) {
      return this.parseVersion(queryVersion);
    }

    // Check version from URL path (/api/v1/users)
    const pathVersionMatch = req.path.match(/^\/api\/v(\d+)\.?(\d*)\.?(\d*)/);
    if (pathVersionMatch) {
      const [, major, minor, patch] = pathVersionMatch;
      return {
        major: parseInt(major, 10),
        minor: parseInt(minor || '0', 10),
        patch: parseInt(patch || '0', 10),
      };
    }

    // Return default version
    return this.defaultVersion;
  }

  private parseVersion(versionString: string): ApiVersion {
    const parts = versionString.split('.').map((p) => parseInt(p, 10));
    return {
      major: parts[0] || 1,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  private isVersionSupported(version: ApiVersion): boolean {
    return this.supportedVersions.some(
      (supported) => supported.major === version.major && supported.minor === version.minor,
    );
  }

  private formatVersion(version: ApiVersion): string {
    return `v${version.major}.${version.minor}.${version.patch}`;
  }

  private buildVersionedPath(originalPath: string, version: ApiVersion): string {
    // Remove existing version prefix if present
    const pathWithoutVersion = originalPath.replace(/^\/api\/v\d+/, '/api');
    return `${pathWithoutVersion}/v${version.major}`;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      apiVersion: ApiVersion;
      versionedPath: string;
    }
  }
}
