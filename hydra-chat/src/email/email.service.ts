import { Injectable } from '@nestjs/common';
import { NotifyClientService } from '../notify-client/notify-client.service.js';

@Injectable()
export class EmailService {
  constructor(private readonly notifyClient: NotifyClientService) {}

  sendChatAlert(chatSender: string, chatMessage: string) {
    return this.notifyClient.sendChatAlert(chatSender, chatMessage);
  }
}
