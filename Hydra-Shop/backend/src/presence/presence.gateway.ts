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
import { PresenceService } from './presence.service.js';
import { PrismaService } from '../database/prisma.service.js';

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

const WS_ORIGINS = [...new Set([...WS_ENV_ORIGINS, ...WS_LOCAL_ORIGINS])];

@WebSocketGateway({
  namespace: 'presence',
  cors: { origin: WS_ORIGINS, credentials: true },
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PresenceGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) throw new UnauthorizedException('No token');

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub ?? payload.userId;
      const rawRole = payload.role ?? payload.roleName ?? '';
      client.userRole = (
        typeof rawRole === 'string' ? rawRole : (rawRole?.name ?? 'CLIENT')
      ).toUpperCase();

      await client.join(`user_${client.userId}`);

      if (client.userRole === 'ADMIN') {
        await client.join('admin_room');
        // Send current online snapshot to the newly connected admin
        const online = await this.presenceService.getOnline();
        client.emit('presence_snapshot', online);
        this.logger.log(`Admin joined presence room: ${client.userId}`);
        return;
      }

      // Regular user — record presence
      const page = client.handshake.query?.page as string | undefined;
      await this.presenceService.join(client.userId!, page);

      const user = await this.prisma.users.findUnique({
        where: { id: client.userId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          username: true,
          avatar_url: true,
        },
      });

      this.server.to('admin_room').emit('user_connected', {
        ...user,
        current_page: page ?? null,
        last_seen: new Date().toISOString(),
      });

      this.logger.log(`User presence: ${client.userId} on ${page ?? '/'}`);
    } catch (err) {
      this.logger.warn(`Presence auth failed: ${err.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.userRole !== 'ADMIN') {
      await this.presenceService.leave(client.userId);
      this.server.to('admin_room').emit('user_disconnected', { userId: client.userId });
    }
  }

  @SubscribeMessage('page_change')
  async handlePageChange(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { page: string },
  ) {
    if (!client.userId || !payload?.page) return;
    await this.presenceService.join(client.userId, payload.page);
    this.server.to('admin_room').emit('user_page_changed', {
      userId: client.userId,
      current_page: payload.page,
      last_seen: new Date().toISOString(),
    });
  }
}
