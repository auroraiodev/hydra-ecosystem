import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      "Redirects the user to Google's OAuth 2.0 consent screen. " +
      'After successful authentication, Google redirects to /auth/google/callback. ' +
      'Consumed by hydra-fe, hydra-admin, and hydra-seller.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth consent screen.',
  })
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles the OAuth 2.0 callback from Google. ' +
      'Issues JWT access token and refresh token as httpOnly cookies, ' +
      'then redirects the user to the appropriate frontend with a base64-encoded user payload.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend /auth/callback?user=<base64> with httpOnly cookies set.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed — invalid or missing Google credentials.',
  })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log(`[googleCallback] req.query: ${JSON.stringify(req.query)}`);
    const { accessToken, refreshToken, user } = await this.authService.handleGoogleAuth(
      req.user as any,
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = isProduction
      ? process.env.COOKIE_DOMAIN || '.hydracollect.com'
      : undefined;

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      domain: cookieDomain,
    };

    res.cookie('__sid', accessToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url ?? null,
      phone: (user as any).phone ?? null,
      role: {
        id: user.roles?.id ?? '',
        name: user.roles?.name ?? '',
        display_name: user.roles?.display_name ?? '',
      },
    };

    const authPayload = Buffer.from(JSON.stringify({ user: userPayload, accessToken })).toString(
      'base64',
    );

    const state = req.query.state as string | undefined;
    if (state) {
      try {
        // Normalize base64 encoding (e.g. convert spaces back to '+' and URL-safe characters)
        const normalizedState = state.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');

        this.logger.log(`[googleCallback] Normalized state: ${normalizedState}`);
        const stateData = JSON.parse(Buffer.from(normalizedState, 'base64').toString());
        this.logger.log(`[googleCallback] Parsed stateData: ${JSON.stringify(stateData)}`);

        const redirectTo = stateData.redirect_to as string | undefined;
        if (redirectTo) {
          const url = new URL(redirectTo);
          url.searchParams.set('oauth_success', 'true');
          url.searchParams.set('auth', authPayload);
          this.logger.log(
            `[googleCallback] Redirecting to state redirect_to target: ${url.toString()}`,
          );
          return res.redirect(url.toString());
        }
      } catch (error) {
        this.logger.error(
          `[googleCallback] Error parsing OAuth state parameter: ${error.message}`,
          error.stack,
        );
      }
    } else {
      this.logger.warn('[googleCallback] No state parameter received in query.');
    }

    const frontendUrl = this.getFrontendUrl(user);

    const redirectPath =
      user.roles?.name === 'ADMIN' || user.roles?.name === 'SELLER'
        ? `/dashboard?oauth_success=true&auth=${authPayload}`
        : `/auth/callback?user=${authPayload}`;

    this.logger.log(
      `[googleCallback] Redirecting to role-based fallback target: ${frontendUrl}${redirectPath}`,
    );
    return res.redirect(`${frontendUrl}${redirectPath}`);
  }

  private getFrontendUrl(user: any): string {
    const role = user?.roles?.name || 'CLIENT';
    const envVars = {
      HYDRA_ADMIN_URL: process.env.HYDRA_ADMIN_URL,
      ADMIN_URL: process.env.ADMIN_URL,
      HYDRA_SELLER_URL: process.env.HYDRA_SELLER_URL,
      SELLER_URL: process.env.SELLER_URL,
      HYDRA_FE_URL: process.env.HYDRA_FE_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
    };
    this.logger.log(`[getFrontendUrl] role: ${role}, envVars: ${JSON.stringify(envVars)}`);

    const isProduction = process.env.NODE_ENV === 'production';

    if (role === 'ADMIN') {
      return (
        process.env.HYDRA_ADMIN_URL ||
        process.env.ADMIN_URL ||
        (isProduction ? 'https://admin.hydracollect.com' : 'http://localhost:3001')
      );
    }
    if (role === 'SELLER') {
      return (
        process.env.HYDRA_SELLER_URL ||
        process.env.SELLER_URL ||
        (isProduction ? 'https://seller.hydracollect.com' : 'http://localhost:3003')
      );
    }
    return (
      process.env.HYDRA_FE_URL ||
      process.env.FRONTEND_URL ||
      (isProduction ? 'https://hydracollect.com' : 'http://localhost:3000')
    );
  }
}
