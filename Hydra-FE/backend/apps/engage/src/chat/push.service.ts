import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '@hydra/database';
import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionKeys {
  @ApiProperty({ description: 'P-256 Diffie-Hellman public key (base64)', example: 'BCO...' })
  p256dh: string;

  @ApiProperty({ description: 'Auth secret (base64)', example: 'aBcD...' })
  auth: string;
}

export class PushSubscriptionDto {
  @ApiProperty({
    description: 'Push subscription endpoint URL',
    example: 'https://fcm.googleapis.com/...',
  })
  endpoint: string;

  @ApiProperty({ description: 'Encryption keys for push messages', type: PushSubscriptionKeys })
  keys: PushSubscriptionKeys;
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
      this.logger.warn(
        'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — push notifications disabled',
      );
    }
  }

  getVapidPublicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  async subscribe(adminId: string, sub: PushSubscriptionDto): Promise<void> {
    await this.prisma.push_subscriptions.upsert({
      where: { endpoint: sub.endpoint },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: {
        admin_id: adminId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });
  }

  async subscribeUser(userId: string, sub: PushSubscriptionDto): Promise<void> {
    await this.prisma.push_subscriptions.upsert({
      where: { endpoint: sub.endpoint },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_id: userId },
      create: {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.push_subscriptions.deleteMany({ where: { endpoint } });
  }

  async notifyUser(
    userId: string,
    payload: { title: string; body: string; url?: string },
  ): Promise<void> {
    if (!this.vapidConfigured) return;

    const subs = await this.prisma.push_subscriptions.findMany({ where: { user_id: userId } });
    if (subs.length === 0) return;

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
            this.logger.warn(`Push failed for user ${userId}: ${err?.message}`);
          }
        }
      }),
    );

    if (dead.length > 0) {
      await this.prisma.push_subscriptions.deleteMany({ where: { endpoint: { in: dead } } });
    }
  }

  async notifyAdmins(payload: { title: string; body: string; url?: string }): Promise<void> {
    if (!this.vapidConfigured) return;

    const subs = await this.prisma.push_subscriptions.findMany({
      where: { NOT: { admin_id: null } },
    });
    if (subs.length === 0) return;

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
