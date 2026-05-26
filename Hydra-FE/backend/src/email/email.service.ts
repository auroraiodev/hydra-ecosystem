import { Injectable } from '@nestjs/common';
import { NotifyClientService, PurchaseEmailData } from '../notify-client/notify-client.service.js';

export type { PurchaseEmailData };

/**
 * Thin delegator — all email delivery has moved to hydra-notify.
 * This class keeps the same public interface so callers (orders, etc.) need no changes.
 */
@Injectable()
export class EmailService {
  constructor(private readonly notifyClient: NotifyClientService) {}

  sendPurchaseNotification(data: PurchaseEmailData) {
    return this.notifyClient.sendPurchaseNotification(data);
  }

  sendCustomerConfirmation(data: PurchaseEmailData) {
    return this.notifyClient.sendCustomerConfirmation(data);
  }

  sendPaymentConfirmation(data: PurchaseEmailData) {
    return this.notifyClient.sendPaymentConfirmation(data);
  }

  sendCustomerPaymentConfirmation(data: PurchaseEmailData) {
    return this.notifyClient.sendCustomerPaymentConfirmation(data);
  }

  sendChatAlert(chatSender: string, chatMessage: string) {
    return this.notifyClient.sendChatAlert(chatSender, chatMessage);
  }
}
