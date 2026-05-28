import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { UserWithRole } from '../../users/interfaces/user.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) throw new Error('JWT_SECRET is required');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req?.cookies && typeof req.cookies === 'object') {
            return (req.cookies as Record<string, string>)['__sid'] ?? null;
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload): UserWithRole {
    const rawRole = (payload.role as any) ?? 'CLIENT';
    const roleName =
      typeof rawRole === 'string' ? rawRole : ((rawRole?.name as string) ?? 'CLIENT');

    return {
      id: payload.sub,
      email: payload.email ?? '',
      username: payload.username ?? '',
      first_name: '',
      last_name: '',
      is_active: true,
      is_hydra_alias: false,
      role: { id: '', name: roleName.toUpperCase(), display_name: roleName },
    };
  }
}
