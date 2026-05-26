import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface PurchaseEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  paymentMethod: string;
  shippingMethod?: string;
}

@Injectable()
export class NotifyClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotifyClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  private readonly streams = new Map<string, Subject<SseEvent>>();
  private subscriber: Redis;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('NOTIFY_SERVICE_URL', 'http://localhost:3005/api/v1');
    this.apiKey = this.config.get<string>('INTERNAL_API_KEY', '');
  }

  onModuleInit() {
    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    this.subscriber = new Redis(redisUrl, { lazyConnect: true });
    this.subscriber.on('error', (err) => {
      this.logger.warn(`Redis subscriber error: ${err.message}`);
    });

    this.subscriber
      .connect()
      .then(() => {
        this.subscriber.psubscribe('notifications:*', (err) => {
          if (err) {
            this.logger.warn(`Redis psubscribe failed: ${err.message}`);
          } else {
            this.logger.log('Redis SSE bridge subscribed to notifications:*');
          }
        });

        this.subscriber.on('pmessage', (_pattern, channel, message) => {
          const userId = channel.replace('notifications:', '');
          const subject = this.streams.get(userId);
          if (subject) {
            try {
              subject.next(JSON.parse(message));
            } catch {
              // ignore malformed messages
            }
          }
        });
      })
      .catch((err) => {
        this.logger.warn(`Redis connection failed — SSE bridge disabled: ${err.message}`);
      });
  }

  async onModuleDestroy() {
    await this.subscriber?.quit();
  }

  private readonly streamRefCount = new Map<string, number>();

  getStream(userId: string) {
    this.streamRefCount.set(userId, (this.streamRefCount.get(userId) || 0) + 1);

    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<SseEvent>());
    }

    return this.streams.get(userId)!.asObservable();
  }

  closeStream(userId: string) {
    const count = (this.streamRefCount.get(userId) || 1) - 1;

    if (count <= 0) {
      this.streamRefCount.delete(userId);
      const subject = this.streams.get(userId);
      if (subject) {
        subject.complete();
        this.streams.delete(userId);
      }
    } else {
      this.streamRefCount.set(userId, count);
    }
  }

  private async post<T = unknown>(path: string, body: T): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`hydra-notify POST /${path} → ${res.status}`);
      }
    } catch (err: any) {
      this.logger.error(`hydra-notify unreachable (/${path}): ${err.message}`);
    }
  }

  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    sendPush?: boolean;
  }) {
    return this.post('notify/user', params);
  }

  async notifyAdmins(params: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    return this.post('notify/admins', params);
  }

  async sendPurchaseNotification(data: PurchaseEmailData) {
    return this.post('email', { target: 'purchase-admin', ...data });
  }

  async sendCustomerConfirmation(data: PurchaseEmailData) {
    return this.post('email', { target: 'purchase-customer', ...data });
  }

  async sendPaymentConfirmation(data: PurchaseEmailData) {
    return this.post('email', { target: 'payment-admin', ...data });
  }

  async sendCustomerPaymentConfirmation(data: PurchaseEmailData) {
    return this.post('email', { target: 'payment-customer', ...data });
  }

  async sendChatAlert(chatSender: string, chatMessage: string) {
    return this.post('email', { target: 'chat-alert', chatSender, chatMessage });
  }
}
