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
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { PushService, PushSubscriptionDto } from './push.service.js';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto.js';
import { JwtAuthGuard, RolesGuard, Roles } from '@hydra/auth';
import type { UserWithRole } from '@hydra/auth';

type AuthRequest = Request & { user: UserWithRole };

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly pushService: PushService,
  ) {}

  @Get('history')
  @ApiOperation({ summary: 'Get chat history for authenticated user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Chat history returned.' })
  async getHistory(
    @Req() req: AuthRequest,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      this.logger.error(`getHistory: req.user.id is missing. user=${JSON.stringify(req.user)}`);
      throw new ForbiddenException('User identity could not be resolved');
    }
    return this.chatService.getHistory(userId, limit);
  }

  @Get('history/user')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get chat history for any user (admin)' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserHistory(
    @Query('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getHistory(userId, limit);
  }

  @Get('conversations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all active chat conversations (admin)' })
  async getConversations() {
    return this.chatService.getConversations();
  }

  @Delete('message/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a specific chat message (admin)' })
  @ApiParam({ name: 'id', type: String })
  async deleteMessage(@Param('id') id: string) {
    await this.chatService.deleteMessage(id);
    return { success: true };
  }

  @Delete('conversation/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete entire conversation for a user (admin)' })
  @ApiParam({ name: 'userId', type: String })
  async deleteConversation(@Param('userId') userId: string) {
    await this.chatService.deleteConversation(userId);
    return { success: true };
  }

  @Get('push/vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscriptions' })
  getVapidPublicKey() {
    return { key: this.pushService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Subscribe admin to push notifications' })
  @ApiBody({ type: PushSubscriptionDto })
  async subscribe(@Req() req: AuthRequest, @Body() body: PushSubscriptionDto) {
    await this.pushService.subscribe(req.user.id, body);
    return { success: true };
  }

  @Post('push/subscribe/user')
  @ApiOperation({ summary: 'Subscribe current user to push notifications' })
  @ApiBody({ type: PushSubscriptionDto })
  async subscribeUser(@Req() req: AuthRequest, @Body() body: PushSubscriptionDto) {
    await this.pushService.subscribeUser(req.user.id, body);
    return { success: true };
  }

  @Delete('push/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribe(@Body() body: UnsubscribePushDto) {
    await this.pushService.unsubscribe(body.endpoint);
    return { success: true };
  }
}
