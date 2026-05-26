import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { UsersService } from '../../users/users.service.js';
import { UserWithRole } from '../../users/interfaces/user.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required and must not be empty');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Check httpOnly cookie first (admin dashboard)
        (req: Request) => {
          if (req?.cookies && typeof req.cookies === 'object') {
            return (req.cookies as Record<string, string>)['__sid'] ?? null;
          }
          return null;
        },
        // Fall back to Authorization: Bearer header (API clients, mobile, frontend)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserWithRole> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }
}
