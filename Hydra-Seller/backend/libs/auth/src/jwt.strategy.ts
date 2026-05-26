import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    console.log('[DEBUG] JwtStrategy - jwtSecret:', jwtSecret);
    if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
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

  async validate(payload: any) {
    // Signature-only validation: no DB lookup — trust the signed payload
    return { id: payload.sub, email: payload.email, role: { name: payload.role } };
  }
}
