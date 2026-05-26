import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly key: string;

  constructor(private readonly config: ConfigService) {
    this.key = this.config.get<string>('INTERNAL_API_KEY', '');
  }

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const provided = request.headers['x-internal-key'];
    if (!this.key || provided !== this.key) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}
