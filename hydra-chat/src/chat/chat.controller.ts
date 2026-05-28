import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service.js';
import { PushService, PushSubscriptionDto } from './push.service.js';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserWithRole } from '../users/interfaces/user.interface.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

type AuthRequest = Request & { user: UserWithRole };

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly pushService: PushService,
  ) {}

  @Get('history')
  async getHistory(
    @Req() req: AuthRequest,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('User identity could not be resolved');
    return this.chatService.getHistory(userId, limit);
  }

  @Get('history/user')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getUserHistory(
    @Query('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getHistory(userId, limit);
  }

  @Get('conversations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getConversations() {
    return this.chatService.getConversations();
  }

  @Delete('message/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteMessage(@Param('id') id: string) {
    await this.chatService.deleteMessage(id);
    return { success: true };
  }

  @Delete('conversation/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteConversation(@Param('userId') userId: string) {
    await this.chatService.deleteConversation(userId);
    return { success: true };
  }

  @Get('push/vapid-public-key')
  getVapidPublicKey() {
    return { key: this.pushService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async subscribe(@Req() req: AuthRequest, @Body() body: PushSubscriptionDto) {
    await this.pushService.subscribe(req.user.id, body);
    return { success: true };
  }

  @Post('push/subscribe/user')
  async subscribeUser(@Req() req: AuthRequest, @Body() body: PushSubscriptionDto) {
    await this.pushService.subscribeUser(req.user.id, body);
    return { success: true };
  }

  @Delete('push/unsubscribe')
  async unsubscribe(@Body() body: UnsubscribePushDto) {
    await this.pushService.unsubscribe(body.endpoint);
    return { success: true };
  }
}
