import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleGoogleAuth(googleUser: any) {
    const { email, firstName, lastName, picture } = googleUser;

    if (!email) {
      throw new UnauthorizedException('No email provided by Google');
    }

    // Find or create user in the shared database
    let user = await this.prisma.users.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      // Create new user with CLIENT role only
      const clientRole = await this.prisma.roles.findUnique({
        where: { name: 'CLIENT' },
      });

      if (!clientRole) {
        throw new UnauthorizedException('CLIENT role not found');
      }

      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      while (await this.prisma.users.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await this.prisma.users.create({
        data: {
          email,
          username,
          first_name: firstName || '',
          last_name: lastName || '',
          avatar_url: picture || null,
          role_id: clientRole.id,
          is_active: true,
        },
        include: { roles: true },
      });
    } else {
      // Update avatar if changed
      if (picture && picture !== user.avatar_url) {
        user = await this.prisma.users.update({
          where: { id: user.id },
          data: { avatar_url: picture },
          include: { roles: true },
        });
      }
    }

    // Issue JWT with role payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roles.name,
    };

    const accessToken = this.jwtService.sign(payload);

    // Create refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const familyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        family_id: familyId,
        expires_at: expiresAt,
      },
    });

    return { accessToken, refreshToken, user };
  }
}
