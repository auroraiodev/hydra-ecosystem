import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../database/prisma.service.js';
import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionKeys {
  @ApiProperty() p256dh: string;
  @ApiProperty() auth: string;
}

export class PushSubscriptionDto {
  @ApiProperty() endpoint: string;
  @ApiProperty({ type: PushSubscriptionKeys }) keys: PushSubscriptionKeys;
}

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
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@hydra.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('VAPID keys configured');
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
    }
  }

  getVapidPublicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  async subscribe(adminId: string, sub: PushSubscriptionDto): Promise<void> {
    await this.prisma.push_subscriptions.upsert({
      where: { endpoint: sub.endpoint },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: { admin_id: adminId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  }

  async subscribeUser(userId: string, sub: PushSubscriptionDto): Promise<void> {
    await this.prisma.push_subscriptions.upsert({
      where: { endpoint: sub.endpoint },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_id: userId },
      create: { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.push_subscriptions.deleteMany({ where: { endpoint } });
  }

  async notifyUser(userId: string, payload: { title: string; body: string; url?: string }): Promise<void> {
    if (!this.vapidConfigured) return;
    const subs = await this.prisma.push_subscriptions.findMany({ where: { user_id: userId } });
    if (subs.length === 0) return;
    await this.sendToSubscriptions(subs, payload);
  }

  async notifyAdmins(payload: { title: string; body: string; url?: string }): Promise<void> {
    if (!this.vapidConfigured) return;
    const subs = await this.prisma.push_subscriptions.findMany({ where: { NOT: { admin_id: null } } });
    if (subs.length === 0) return;
    await this.sendToSubscriptions(subs, payload);
  }

  private async sendToSubscriptions(subs: any[], payload: object): Promise<void> {
    const message = JSON.stringify(payload);
    const dead: string[] = [];

    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message);
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) dead.push(s.endpoint);
          else this.logger.warn(`Push failed: ${err?.message}`);
        }
      }),
    );

    if (dead.length > 0) {
      await this.prisma.push_subscriptions.deleteMany({ where: { endpoint: { in: dead } } });
    }
  }
}
