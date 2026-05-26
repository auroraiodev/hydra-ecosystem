import { Module } from '@nestjs/common';
import { ModalController } from './modal.controller.js';
import { ModalService } from './modal.service.js';

@Module({
  controllers: [ModalController],
  providers: [ModalService],
  exports: [ModalService],
})
export class ModalModule {}
