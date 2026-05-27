import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async join(userId: string, currentPage?: string) {
    await this.prisma.user_sessions.upsert({
      where: { user_id: userId },
      create: { user_id: userId, current_page: currentPage ?? null, last_seen: new Date() },
      update: { last_seen: new Date(), current_page: currentPage ?? null },
    });
  }

  async leave(userId: string) {
    await this.prisma.user_sessions
      .delete({ where: { user_id: userId } })
      .catch(() => {});
  }

  async getOnline() {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    return this.prisma.user_sessions.findMany({
      where: { last_seen: { gte: cutoff } },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            username: true,
            avatar_url: true,
            roles: { select: { name: true } },
          },
        },
      },
      orderBy: { last_seen: 'desc' },
    });
  }

  async cleanup() {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    await this.prisma.user_sessions.deleteMany({ where: { last_seen: { lt: cutoff } } });
  }
}
