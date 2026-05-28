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
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — SSE bridge disabled');
      return;
    }

    this.subscriber = new Redis(redisUrl, { lazyConnect: true });
    this.subscriber.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));

    this.subscriber
      .connect()
      .then(() => {
        this.subscriber.psubscribe('notifications:*', (err) => {
          if (err) this.logger.warn(`Redis psubscribe failed: ${err.message}`);
          else this.logger.log('Redis SSE bridge subscribed to notifications:*');
        });

        this.subscriber.on('pmessage', (_pattern, channel, message) => {
          const userId = channel.replace('notifications:', '');
          const subject = this.streams.get(userId);
          if (subject) {
            try { subject.next(JSON.parse(message)); } catch { /* ignore */ }
          }
        });
      })
      .catch((err) => this.logger.warn(`Redis connect failed: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.subscriber?.quit();
  }

  private async post<T = unknown>(path: string, body: T): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': this.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) this.logger.warn(`hydra-notify POST /${path} → ${res.status}`);
    } catch (err) {
      this.logger.error(`hydra-notify unreachable (/${path}): ${err.message}`);
    }
  }

  async sendChatAlert(chatSender: string, chatMessage: string) {
    return this.post('email', { target: 'chat-alert', chatSender, chatMessage });
  }
}
