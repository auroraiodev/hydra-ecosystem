import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async isIpBlocked(ip: string): Promise<boolean> {
    if (!ip) return false;
    return !!(await this.prisma.blocked_ips.findUnique({ where: { ip_address: ip } }));
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    if (!userId) return false;
    return !!(await this.prisma.blocked_users.findUnique({ where: { user_id: userId } }));
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
    await this.prisma.user_sessions.delete({ where: { user_id: userId } }).catch(() => {});
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
            id: true, first_name: true, last_name: true, email: true,
            username: true, avatar_url: true, roles: { select: { name: true } },
          },
        },
      },
      orderBy: { last_seen: 'desc' },
    });
  }

  async blockIp(ip: string, reason?: string, blockedBy?: string) {
    return this.prisma.blocked_ips.upsert({
      where: { ip_address: ip },
      create: { ip_address: ip, reason: reason ?? null, blocked_by: blockedBy ?? null },
      update: { reason: reason ?? null },
    });
  }

  async unblockIp(ip: string) {
    await this.prisma.blocked_ips.delete({ where: { ip_address: ip } }).catch(() => {});
  }

  async blockUser(userId: string, reason?: string, blockedBy?: string) {
    return this.prisma.blocked_users.upsert({
      where: { user_id: userId },
      create: { user_id: userId, reason: reason ?? null, blocked_by: blockedBy ?? null },
      update: { reason: reason ?? null },
    });
  }

  async unblockUser(userId: string) {
    await this.prisma.blocked_users.delete({ where: { user_id: userId } }).catch(() => {});
  }
}
