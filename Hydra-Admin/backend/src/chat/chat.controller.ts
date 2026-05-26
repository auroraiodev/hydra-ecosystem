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
import { ChatService } from './chat.service.js';
import { PushService, PushSubscriptionDto } from './push.service.js';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserWithRole } from '../users/interfaces/user.interface.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

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
  @ApiOperation({
    summary: 'Get chat history for authenticated user',
    description: 'Returns the last N chat messages for the currently authenticated user.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to return (default: 50)',
  })
  @ApiResponse({ status: 200, description: 'Chat history returned.' })
  @ApiResponse({ status: 403, description: 'User identity could not be resolved.' })
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
  @ApiOperation({
    summary: 'Get chat history for any user (admin)',
    description: "Allows admins to view any user's chat history.",
  })
  @ApiQuery({ name: 'userId', required: true, type: String, description: 'Target user UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to return (default: 50)',
  })
  @ApiResponse({ status: 200, description: 'User chat history returned.' })
  @ApiResponse({ status: 403, description: 'User is not an admin.' })
  async getUserHistory(
    @Query('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getHistory(userId, limit);
  }

  @Get('conversations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List all active chat conversations (admin)',
    description: 'Returns all active chat threads grouped by user for admin monitoring.',
  })
  @ApiResponse({ status: 200, description: 'Active conversations returned.' })
  @ApiResponse({ status: 403, description: 'User is not an admin.' })
  async getConversations() {
    return this.chatService.getConversations();
  }

  @Delete('message/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete a specific chat message (admin)',
    description: 'Permanently deletes a single chat message by its ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Message UUID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted.',
    schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
  })
  @ApiResponse({ status: 403, description: 'User is not an admin.' })
  async deleteMessage(@Param('id') id: string) {
    await this.chatService.deleteMessage(id);
    return { success: true };
  }

  @Delete('conversation/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete entire conversation for a user (admin)',
    description: 'Permanently deletes all chat messages for a given user.',
  })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID whose conversation to delete' })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted.',
    schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
  })
  @ApiResponse({ status: 403, description: 'User is not an admin.' })
  async deleteConversation(@Param('userId') userId: string) {
    await this.chatService.deleteConversation(userId);
    return { success: true };
  }

  @Get('push/vapid-public-key')
  @ApiOperation({
    summary: 'Get VAPID public key for push subscriptions',
    description: 'Returns the VAPID public key clients need to subscribe to push notifications.',
  })
  @ApiResponse({
    status: 200,
    description: 'VAPID public key returned.',
    schema: { type: 'object', properties: { key: { type: 'string' } } },
  })
  getVapidPublicKey() {
    return { key: this.pushService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Subscribe admin to push notifications',
    description: "Registers an admin's push subscription endpoint for real-time notifications.",
  })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Push subscription registered.',
    schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
  })
  @ApiResponse({ status: 403, description: 'User is not an admin.' })
  async subscribe(@Req() req: AuthRequest, @Body() body: PushSubscriptionDto) {
    await this.pushService.subscribe(req.user.id, body);
    return { success: true };
  }

  @Post('push/subscribe/user')
  @ApiOperation({
    summary: 'Subscribe current user to push notifications',
    description: "Registers the authenticated user's push subscription endpoint.",
  })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Push subscription registered.',
    schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
  })
  async subscribeUser(@Req() req: AuthRequest, @Body() body: PushSubscriptionDto) {
    await this.pushService.subscribeUser(req.user.id, body);
    return { success: true };
  }

  @Delete('push/unsubscribe')
  @ApiOperation({
    summary: 'Unsubscribe from push notifications',
    description: 'Removes a push subscription by its endpoint URL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Push subscription removed.',
    schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } },
  })
  async unsubscribe(@Body() body: UnsubscribePushDto) {
    await this.pushService.unsubscribe(body.endpoint);
    return { success: true };
  }
}
