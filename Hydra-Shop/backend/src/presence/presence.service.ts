import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async isIpBlocked(ip: string): Promise<boolean> {
    if (!ip) return false;
    const entry = await this.prisma.blocked_ips.findUnique({ where: { ip_address: ip } });
    return !!entry;
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    if (!userId) return false;
    const entry = await this.prisma.blocked_users.findUnique({ where: { user_id: userId } });
    return !!entry;
  }

  async join(userId: string, page?: string, ip?: string) {
    await this.prisma.user_sessions.upsert({
      where: { user_id: userId },
      create: { user_id: userId, current_page: page ?? null, ip_address: ip ?? null, last_seen: new Date() },
      update: { last_seen: new Date(), current_page: page ?? null, ip_address: ip ?? null },
    });
    if (page) await this.logVisit(userId, page, ip);
  }

  async leave(userId: string) {
    await this.prisma.user_sessions
      .delete({ where: { user_id: userId } })
      .catch(() => {});
  }

  async logVisit(userId: string, page: string, ip?: string) {
    await this.prisma.user_page_visits.create({
      data: { user_id: userId, page, ip_address: ip ?? null },
    });
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

  async getHistory(filters: {
    userId?: string;
    page?: string;
    ip?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.userId) where.user_id = filters.userId;
    if (filters.page) where.page = { contains: filters.page, mode: 'insensitive' };
    if (filters.ip) where.ip_address = { contains: filters.ip };
    if (filters.from || filters.to) {
      where.visited_at = {};
      if (filters.from) where.visited_at.gte = filters.from;
      if (filters.to) where.visited_at.lte = filters.to;
    }

    const [total, visits] = await Promise.all([
      this.prisma.user_page_visits.count({ where }),
      this.prisma.user_page_visits.findMany({
        where,
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
        orderBy: { visited_at: 'desc' },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      }),
    ]);

    return { total, visits };
  }

  async blockIp(ip: string, reason?: string, blockedBy?: string) {
    return this.prisma.blocked_ips.upsert({
      where: { ip_address: ip },
      create: { ip_address: ip, reason: reason ?? null, blocked_by: blockedBy ?? null },
      update: { reason: reason ?? null },
    });
  }

  async unblockIp(ip: string) {
    await this.prisma.blocked_ips
      .delete({ where: { ip_address: ip } })
      .catch(() => {});
  }

  async getBlockedIps() {
    return this.prisma.blocked_ips.findMany({ orderBy: { created_at: 'desc' } });
  }

  async blockUser(userId: string, reason?: string, blockedBy?: string) {
    return this.prisma.blocked_users.upsert({
      where: { user_id: userId },
      create: { user_id: userId, reason: reason ?? null, blocked_by: blockedBy ?? null },
      update: { reason: reason ?? null },
    });
  }

  async unblockUser(userId: string) {
    await this.prisma.blocked_users
      .delete({ where: { user_id: userId } })
      .catch(() => {});
  }

  async getBlockedUsers() {
    return this.prisma.blocked_users.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  async cleanup() {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    await this.prisma.user_sessions.deleteMany({ where: { last_seen: { lt: cutoff } } });
  }
}
