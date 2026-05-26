import { Module } from '@nestjs/common';
import { TcgsController } from './tcgs.controller.js';
import { TcgsService } from './tcgs.service.js';
import { PrismaModule } from '@hydra/database';

@Module({
  imports: [PrismaModule],
  controllers: [TcgsController],
  providers: [TcgsService],
  exports: [TcgsService],
})
export class TcgsModule {}
