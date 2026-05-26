import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { Public } from './guards/jwt-auth.guard.js';
import { ConfigService } from '@nestjs/config';

// Strict rate limit: 10 attempts per 5 minutes per IP on auth endpoints
const AUTH_THROTTLE = { short: { ttl: 300000, limit: 10 } };

const COOKIE_OPTIONS = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly isProduction: boolean;

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
  }

  @Post('login')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (All roles: CLIENT, ADMIN, SELLER)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    res.cookie('__sid', result.accessToken, COOKIE_OPTIONS(this.isProduction));
    return result;
  }

  @Post('admin-login')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin/Staff login (ADMIN and SELLER only) — sets httpOnly cookie' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied. Admin or Seller role required' })
  async adminLogin(
    @Body() adminLoginDto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Admin login attempt for ${adminLoginDto.email}`);
    const result = await this.authService.adminLogin(adminLoginDto);
    res.cookie('__sid', result.accessToken, COOKIE_OPTIONS(this.isProduction));
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('admin-logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout — clears httpOnly cookie' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async adminLogout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('__sid', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
    });
    return { success: true };
  }

  @Post('admin-session')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Exchange a one-time JWT (from OAuth redirect URL) for an httpOnly cookie — prevents token exposure in localStorage',
  })
  @ApiResponse({ status: 200, description: 'Cookie set' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async adminSession(@Body('token') token: string, @Res({ passthrough: true }) res: Response) {
    if (!token) throw new UnauthorizedException('Token is required');
    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    res.cookie('__sid', token, COOKIE_OPTIONS(this.isProduction));
    return { success: true };
  }

  @Post('refresh')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('refreshToken is required');
    return this.authService.refresh(refreshToken);
  }
}
