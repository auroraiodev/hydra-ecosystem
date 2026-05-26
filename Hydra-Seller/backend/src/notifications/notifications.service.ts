import { Injectable, Logger } from '@nestjs/common';
import { map, finalize } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { NotifyClientService } from '../notify-client/notify-client.service.js';

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  LISTING_STATUS = 'LISTING_STATUS',
  ITEM_DELIVERY = 'ITEM_DELIVERY',
  WALLET_TX = 'WALLET_TX',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  ADMIN_ALERT = 'ADMIN_ALERT',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyClient: NotifyClientService,
  ) {}

  // ── SSE stream (managed by NotifyClientService Redis bridge) ─────────────

  getStream(userId: string): Observable<MessageEvent> {
    this.logger.log(`SSE stream opened for user ${userId}`);
    return this.notifyClient.getStream(userId).pipe(
      map((event) => ({ data: event })),
      finalize(() => {
        this.logger.log(`SSE stream closed for user ${userId}`);
        this.notifyClient.closeStream(userId);
      }),
    );
  }

  // ── Write path (delegated to hydra-notify) ───────────────────────────────

  async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    sendEmail?: boolean;
    sendPush?: boolean;
  }) {
    return this.notifyClient.createNotification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      sendPush: params.sendPush,
    });
  }

  async notifyAdmins(params: {
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    return this.notifyClient.notifyAdmins(params);
  }

  // ── Read path (stays in hydra-be — direct DB access) ─────────────────────

  async getNotifications(userId: string, limit = 20) {
    return this.prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }
}
