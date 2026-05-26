import { Module } from '@nestjs/common';
import { ModalController } from './modal.controller.js';
import { ModalService } from './modal.service.js';
import { PrismaModule } from '../database/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ModalController],
  providers: [ModalService],
  exports: [ModalService],
})
export class ModalModule {}
