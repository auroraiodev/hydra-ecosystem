import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hydra/database';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      include: { roles: true },
    });
  }
}
