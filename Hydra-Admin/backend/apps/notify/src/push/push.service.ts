import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidConfigured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@hydra-tcg.com');

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('VAPID keys configured');
    } else {
      this.logger.warn('VAPID keys not set — web push disabled');
    }
  }

  async notifyUser(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.vapidConfigured) return;
    const subs = await this.prisma.push_subscriptions.findMany({ where: { user_id: userId } });
    if (subs.length === 0) return;
    await this.sendToSubscriptions(subs, payload);
  }

  async notifyAdmins(payload: { title: string; body: string; url?: string }) {
    if (!this.vapidConfigured) return;
    const subs = await this.prisma.push_subscriptions.findMany({
      where: { NOT: { admin_id: null } },
    });
    if (subs.length === 0) return;
    await this.sendToSubscriptions(subs, payload);
  }

  private async sendToSubscriptions(subs: any[], payload: object) {
    const message = JSON.stringify(payload);
    const dead: string[] = [];

    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            message,
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            dead.push(s.endpoint);
          } else {
            this.logger.warn(`Push failed for ${s.endpoint}: ${err?.message}`);
          }
        }
      }),
    );

    if (dead.length > 0) {
      await this.prisma.push_subscriptions.deleteMany({ where: { endpoint: { in: dead } } });
    }
  }
}
