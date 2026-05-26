import { Injectable, ServiceUnavailableException, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: any) {
    if (!this.configService.get<string>('GOOGLE_CLIENT_ID')) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      );
    }
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const redirectTo = request.query.redirect_to as string | undefined;
    console.log('[GoogleAuthGuard] request.query:', request.query);
    console.log('[GoogleAuthGuard] redirect_to:', redirectTo);
    if (redirectTo) {
      const state = Buffer.from(JSON.stringify({ redirect_to: redirectTo })).toString('base64');
      console.log('[GoogleAuthGuard] generated state:', state);
      return { state };
    }
    return {};
  }
}
