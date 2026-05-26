import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const familyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        family_id: familyId,
        expires_at: expiresAt,
      },
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<any> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const storedToken = await this.prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked_at) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    return { sub: storedToken.user_id, familyId: storedToken.family_id };
  }

  async revokeRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.refresh_tokens.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refresh_tokens.updateMany({
      where: { user_id: userId },
      data: { revoked_at: new Date() },
    });
  }
}
