import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(userId: string, content: string, sender: 'user' | 'admin' | 'bot') {
    return this.prisma.chat_messages.create({
      data: { user_id: userId, content, sender },
    });
  }

  async getHistory(userId: string, limit = 50) {
    return this.prisma.chat_messages.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
      take: limit,
    });
  }

  async deleteMessage(messageId: string) {
    return this.prisma.chat_messages.delete({ where: { id: messageId } });
  }

  async deleteConversation(userId: string) {
    return this.prisma.chat_messages.deleteMany({ where: { user_id: userId } });
  }

  /** Returns list of users with at least one chat message (for admin conversations list) */
  async getConversations() {
    const rows = await this.prisma.chat_messages.groupBy({
      by: ['user_id'],
      _count: { id: true },
      _max: { created_at: true },
      orderBy: { _max: { created_at: 'desc' } },
    });

    if (rows.length === 0) return [];

    const userIds = rows.map((r) => r.user_id);
    const users = await this.prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, first_name: true, last_name: true, email: true, avatar_url: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Fetch the latest message content for each user
    const conversations = await Promise.all(
      rows.map(async (r) => {
        const lastMsg = await this.prisma.chat_messages.findFirst({
          where: { user_id: r.user_id },
          orderBy: { created_at: 'desc' },
          select: { content: true },
        });

        const unreadCount = await this.prisma.chat_messages.count({
          where: { user_id: r.user_id, sender: 'user', is_read: false },
        });

        const user = userMap.get(r.user_id);
        return {
          userId: r.user_id,
          userName: user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : 'Unknown User',
          userEmail: user?.email || '',
          lastMessageAt: r._max.created_at,
          lastMessage: lastMsg?.content || '',
          unreadCount,
        };
      }),
    );

    return conversations;
  }

  async markUserMessagesRead(userId: string) {
    return this.prisma.chat_messages.updateMany({
      where: { user_id: userId, sender: 'user', is_read: false },
      data: { is_read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.chat_messages.count({
      where: { user_id: userId, sender: 'admin', is_read: false },
    });
  }

  async getUserInfo(userId: string): Promise<{ id: string; name: string; email: string } | null> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, first_name: true, last_name: true, email: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      email: user.email,
    };
  }
}
