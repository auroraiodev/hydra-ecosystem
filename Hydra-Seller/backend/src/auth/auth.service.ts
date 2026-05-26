import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const MAX_LOGIN_ATTEMPTS = 5;
const REFRESH_TOKEN_BYTES = 32;
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly lockoutDurationMinutes: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.lockoutDurationMinutes = parseInt(
      configService.get<string>('LOCKOUT_DURATION_MINUTES', '15'),
      10,
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private buildUserPayload(user: any) {
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role?.name || user.roles?.name,
    };
  }

  private formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url || null,
      phone: user.phone || null,
      role: {
        id: user.role?.id || user.roles?.id,
        name: user.role?.name || user.roles?.name,
        display_name: user.role?.display_name || user.roles?.display_name,
      },
    };
  }

  private async issueTokenPair(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(this.buildUserPayload(user));
    const rawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        family_id: familyId,
        expires_at: expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private async checkLockout(user: any): Promise<void> {
    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException(
        'Account temporarily locked due to too many failed login attempts. Please try again later.',
      );
    }
  }

  private async handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    const updateData: { failed_login_attempts: number; locked_until?: Date } = {
      failed_login_attempts: newAttempts,
    };
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + this.lockoutDurationMinutes);
      updateData.locked_until = lockedUntil;
      this.logger.warn(`Account ${userId} locked after ${newAttempts} failed attempts`);
    }
    await this.prisma.users.update({ where: { id: userId }, data: updateData });
  }

  private async clearFailedLogins(userId: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { failed_login_attempts: 0, locked_until: null },
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.checkLockout(user);

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, user.failed_login_attempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.clearFailedLogins(user.id);

    const { accessToken, refreshToken } = await this.issueTokenPair(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: this.formatUserResponse(userWithoutPassword),
    };
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: adminLoginDto.email },
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.roles.name !== 'ADMIN' && user.roles.name !== 'SELLER') {
      throw new ForbiddenException('Access denied. Admin or Seller role required.');
    }

    await this.checkLockout(user);

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(adminLoginDto.password, user.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, user.failed_login_attempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.clearFailedLogins(user.id);

    const { accessToken, refreshToken } = await this.issueTokenPair(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: this.formatUserResponse(userWithoutPassword),
    };
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: { user: { include: { roles: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked_at) {
      // Replay detected — revoke entire token family to contain potential theft
      await this.prisma.refresh_tokens.updateMany({
        where: { family_id: storedToken.family_id },
        data: { revoked_at: new Date() },
      });
      this.logger.warn(
        `Refresh token replay detected for family ${storedToken.family_id} — full family revoked`,
      );
      throw new UnauthorizedException('Refresh token reuse detected — please log in again');
    }

    if (storedToken.expires_at < new Date()) {
      await this.prisma.refresh_tokens.update({
        where: { id: storedToken.id },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = (storedToken as any).user;

    if (!user.is_active) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Revoke old token (rotation)
    await this.prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Issue new token in same family
    const newRawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: newTokenHash,
        family_id: storedToken.family_id,
        expires_at: expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(this.buildUserPayload(user));
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      user: this.formatUserResponse(userWithoutPassword),
    };
  }
}
