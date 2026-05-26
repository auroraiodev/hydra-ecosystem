import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../database/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { PushService } from '../push/push.service.js';
import { CreateNotificationDto, NotifyAdminsDto } from './dto/create-notification.dto.js';
import { SendEmailDto, EmailTarget } from './dto/send-email.dto.js';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private publisher: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly push: PushService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    this.publisher = new Redis(redisUrl, { lazyConnect: true });
    this.publisher.on('error', (err) => {
      this.logger.warn(`Redis publisher error: ${err.message}`);
    });
    this.publisher.connect().catch((err) => {
      this.logger.warn(`Redis connection failed — SSE bridge disabled: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.publisher?.quit();
  }

  async createNotification(dto: CreateNotificationDto) {
    const { userId, type, title, message, data, sendPush } = dto;

    try {
      const notification = await (this.prisma as any).notifications.create({
        data: {
          user_id: userId,
          type,
          title,
          message,
          data: (data ?? {}) as any,
        },
      });

      // Publish to Redis so hydra-be can push to the user's SSE stream
      const event = {
        id: notification.id,
        type,
        title,
        message,
        data: data ?? {},
        created_at: notification.created_at,
      };
      await this.publisher
        .publish(`notifications:${userId}`, JSON.stringify(event))
        .catch((err) => this.logger.warn(`Redis publish failed: ${err.message}`));

      if (sendPush) {
        this.push
          .notifyUser(userId, { title, body: message })
          .catch((err) => this.logger.warn(`Push failed: ${err.message}`));
      }

      return notification;
    } catch (err) {
      this.logger.error(`Failed to create notification: ${err.message}`, err.stack);
    }
  }

  async notifyAdmins(dto: NotifyAdminsDto) {
    const { type, title, message, data } = dto;

    try {
      const admins = await (this.prisma as any).users.findMany({
        where: { roles: { name: 'ADMIN' } },
        select: { id: true },
      });

      if (admins.length === 0) {
        this.logger.warn('No admin users found to notify');
        return;
      }

      await (this.prisma as any).notifications.createMany({
        data: admins.map((a) => ({
          user_id: a.id,
          type,
          title,
          message,
          data: (data ?? {}) as any,
        })),
      });

      const event = {
        id: `broadcast-${Date.now()}`,
        type,
        title,
        message,
        data: data ?? {},
        created_at: new Date(),
      };

      await Promise.allSettled(
        admins.map((a) =>
          this.publisher
            .publish(`notifications:${a.id}`, JSON.stringify(event))
            .catch((err) =>
              this.logger.warn(`Redis publish failed for admin ${a.id}: ${err.message}`),
            ),
        ),
      );

      this.push
        .notifyAdmins({
          title,
          body: message,
          url: data?.orderId ? `/dashboard/pedidos/${data.orderId}` : '/dashboard',
        })
        .catch((err) => this.logger.warn(`Admin push failed: ${err.message}`));

      this.logger.log(`Admin notification "${title}" dispatched to ${admins.length} admins`);
    } catch (err) {
      this.logger.error(`Failed to notify admins: ${err.message}`, err.stack);
    }
  }

  async sendEmail(dto: SendEmailDto) {
    const emailData = {
      orderId: dto.orderId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      totalAmount: dto.totalAmount,
      items: dto.items,
      paymentMethod: dto.paymentMethod,
      shippingMethod: dto.shippingMethod,
    };

    switch (dto.target) {
      case EmailTarget.PURCHASE_ADMIN:
        return this.email.sendPurchaseNotification(emailData as any);
      case EmailTarget.PURCHASE_CUSTOMER:
        return this.email.sendCustomerConfirmation(emailData as any);
      case EmailTarget.PAYMENT_ADMIN:
        return this.email.sendPaymentConfirmation(emailData as any);
      case EmailTarget.PAYMENT_CUSTOMER:
        return this.email.sendCustomerPaymentConfirmation(emailData as any);
      case EmailTarget.CHAT_ALERT:
        return this.email.sendChatAlert(dto.chatSender || 'Cliente', dto.chatMessage || '');
    }
  }
}
