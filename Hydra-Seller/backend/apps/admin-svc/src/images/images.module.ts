import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [StorageModule],
  controllers: [ImagesController],
})
export class ImagesModule {}
