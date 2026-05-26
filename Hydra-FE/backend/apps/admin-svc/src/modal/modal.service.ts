import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hydra/database';

@Injectable()
export class ModalService {
  constructor(private prisma: PrismaService) {}

  async hasSeen(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { has_seen_modal: true },
    });

    return user?.has_seen_modal ?? false;
  }

  async markAsSeen(userId: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { has_seen_modal: true },
    });
  }
}
