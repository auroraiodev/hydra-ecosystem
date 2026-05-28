import { Controller, Get, Query, Req } from '@nestjs/common';
import { Public } from '../auth/guards/jwt-auth.guard.js';
import { PresenceService } from './presence.service.js';
import { Request } from 'express';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('check-ip')
  @Public()
  async checkIp(@Req() req: Request, @Query('ip') ipParam?: string) {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ip = ipParam || forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const blocked = await this.presenceService.isIpBlocked(ip);
    return { blocked };
  }
}
