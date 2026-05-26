import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service.js';
import { PushService } from './push.service.js';
import { AiBotService } from './ai-bot.service.js';
import { EmailService } from '../email/email.service.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

const WS_ENV_ORIGINS: string[] = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.SELLER_URL,
]
  .filter(Boolean)
  .flatMap((v) => v!.split(',').map((s) => s.trim()));

const WS_LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const WS_ORIGINS: string | string[] = [...new Set([...WS_ENV_ORIGINS, ...WS_LOCAL_ORIGINS])];

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: WS_ORIGINS,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /** Per-user bot mode. Default: true (bot responds). False: admin took over. */
  private readonly botMode = new Map<string, boolean>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly pushService: PushService,
    private readonly aiBotService: AiBotService,
    private readonly emailService: EmailService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new UnauthorizedException('No token provided');

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub ?? payload.userId;
      // JWT payload.role is a plain string (e.g. 'ADMIN', 'CLIENT')
      // Guard against both string form and object form { name: 'ADMIN' }
      const rawRole = payload.role ?? payload.roleName ?? '';
      client.userRole = (
        typeof rawRole === 'string' ? rawRole : (rawRole?.name ?? 'CLIENT')
      ).toUpperCase();

      // User joins their personal room; admins also join admin_room
      await client.join(`user_${client.userId}`);
      if (client.userRole === 'ADMIN') {
        await client.join('admin_room');
        this.logger.log(`Admin connected: ${client.userId}`);
      } else {
        this.logger.log(`User connected: ${client.userId}`);
        // Notify admin room with user details so sidebar can show them without prior messages
        const userInfo = await this.chatService.getUserInfo(client.userId!);
        this.server.to('admin_room').emit('user_online', {
          userId: client.userId,
          userName: userInfo?.name ?? '',
          userEmail: userInfo?.email ?? '',
        });
      }
    } catch (err) {
      this.logger.warn(`WS auth failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.userRole !== 'ADMIN') {
      this.server.to('admin_room').emit('user_offline', { userId: client.userId });
    }
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  /**
   * User sends message to admin
   * Event: send_message  payload: { content: string }
   */
  @SubscribeMessage('send_message')
  async handleUserMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { content: string },
  ) {
    if (!client.userId || !payload?.content?.trim()) return;

    const msg = await this.chatService.saveMessage(client.userId, payload.content.trim(), 'user');

    const messageEvent = {
      id: msg.id,
      userId: client.userId,
      content: msg.content,
      sender: 'user',
      createdAt: msg.created_at,
    };

    // Echo back to sender
    client.emit('message', messageEvent);

    // Forward to admin room
    this.server.to('admin_room').emit('new_user_message', messageEvent);

    // Push notification to admins not currently online (fire-and-forget)
    const userInfo = await this.chatService.getUserInfo(client.userId);
    const senderName = userInfo?.name || userInfo?.email || 'Cliente';
    this.pushService
      .notifyAdmins({
        title: `Nuevo mensaje — ${senderName}`,
        body: msg.content.length > 80 ? msg.content.slice(0, 77) + '…' : msg.content,
        url: `/dashboard/chat?user=${client.userId}`,
      })
      .catch(() => {
        /* non-blocking */
      });

    // Email alert to darmfma@gmail.com (fire-and-forget)
    this.emailService.sendChatAlert(senderName, msg.content).catch(() => {
      /* non-blocking */
    });

    // AI bot auto-reply if bot mode is active for this user
    const botActive = this.botMode.get(client.userId) !== false;
    if (botActive && this.aiBotService.isEnabled) {
      const botReply = await this.aiBotService.reply(client.userId, payload.content.trim());
      if (botReply) {
        const botMsg = await this.chatService.saveMessage(client.userId, botReply, 'bot');
        const botEvent = {
          id: botMsg.id,
          userId: client.userId,
          content: botMsg.content,
          sender: 'bot',
          createdAt: botMsg.created_at,
        };
        // Send to user
        this.server.to(`user_${client.userId}`).emit('message', botEvent);
        // Send to admin room so they see bot response
        this.server.to('admin_room').emit('new_user_message', botEvent);
      }
    }
  }

  /**
   * Admin sends reply to a specific user
   * Event: admin_reply  payload: { userId: string; content: string }
   * Side-effect: disables bot mode for that user conversation
   */
  @SubscribeMessage('admin_reply')
  async handleAdminReply(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userId: string; content: string },
  ) {
    if (client.userRole !== 'ADMIN') return;
    if (!payload?.userId || !payload?.content?.trim()) return;

    // Human takes over — disable bot for this conversation
    if (this.botMode.get(payload.userId) !== false) {
      this.botMode.set(payload.userId, false);
      this.server
        .to('admin_room')
        .emit('bot_mode_changed', { userId: payload.userId, enabled: false });
    }

    const msg = await this.chatService.saveMessage(payload.userId, payload.content.trim(), 'admin');

    const messageEvent = {
      id: msg.id,
      userId: payload.userId,
      content: msg.content,
      sender: 'admin',
      createdAt: msg.created_at,
    };

    // Send to the target user's room
    this.server.to(`user_${payload.userId}`).emit('message', messageEvent);

    // Echo back to admin (for their own UI update)
    client.emit('message_sent', messageEvent);

    // Push notification to user if they're not online (fire-and-forget)
    this.pushService
      .notifyUser(payload.userId, {
        title: 'Nuevo mensaje de Soporte Hydra',
        body: msg.content.length > 80 ? msg.content.slice(0, 77) + '…' : msg.content,
        url: '/?open_chat=true',
      })
      .catch(() => {
        /* non-blocking */
      });
  }

  /**
   * Admin toggles bot mode for a conversation
   * Event: toggle_bot  payload: { userId: string; enabled: boolean }
   */
  @SubscribeMessage('toggle_bot')
  async handleToggleBot(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userId: string; enabled: boolean },
  ) {
    if (client.userRole !== 'ADMIN') return;
    if (!payload?.userId || typeof payload.enabled !== 'boolean') return;

    this.botMode.set(payload.userId, payload.enabled);
    this.logger.log(`Bot mode for user ${payload.userId}: ${payload.enabled}`);

    // Notify all admins so every open tab stays in sync
    this.server.to('admin_room').emit('bot_mode_changed', {
      userId: payload.userId,
      enabled: payload.enabled,
    });
  }

  /**
   * Admin marks a thread as read
   * Event: mark_read  payload: { userId: string }
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userId: string },
  ) {
    if (client.userRole !== 'ADMIN') return;
    await this.chatService.markUserMessagesRead(payload.userId);
  }
}
