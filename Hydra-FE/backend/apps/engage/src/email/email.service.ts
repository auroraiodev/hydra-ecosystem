import { Injectable } from '@nestjs/common';
import { NotifyClientService, PurchaseEmailData } from '../notify-client/notify-client.service.js';

export type { PurchaseEmailData };

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
