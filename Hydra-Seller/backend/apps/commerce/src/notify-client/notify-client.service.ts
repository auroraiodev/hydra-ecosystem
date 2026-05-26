import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PurchaseEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  paymentMethod: string;
  shippingMethod?: string;
}

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  LISTING_STATUS = 'LISTING_STATUS',
  ITEM_DELIVERY = 'ITEM_DELIVERY',
  WALLET_TX = 'WALLET_TX',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  ADMIN_ALERT = 'ADMIN_ALERT',
}

@Injectable()
export class NotifyClientService {
  private readonly logger = new Logger(NotifyClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('NOTIFY_SERVICE_URL', 'http://localhost:3005/api/v1');
    this.apiKey = this.config.get<string>('INTERNAL_API_KEY', '');
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
      // Never throw — notification failures must not break core commerce flows
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
}
