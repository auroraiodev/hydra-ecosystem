import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@hydra/database';
import { CreateTcgDto } from './dto/create-tcg.dto.js';
import { UpdateTcgDto } from './dto/update-tcg.dto.js';
import { CacheService } from '@hydra/common';

@Injectable()
export class TcgsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createTcgDto: CreateTcgDto) {
    // Check if TCG with same name already exists
    const existing = await this.prisma.tcgs.findUnique({
      where: { name: createTcgDto.name },
    });

    if (existing) {
      throw new ConflictException('TCG with this name already exists');
    }

    if (createTcgDto.order === undefined) {
      const count = await (this.prisma.tcgs as any).count();
      createTcgDto.order = count + 1;
    }

    const tcg = await (this.prisma.tcgs as any).create({
      data: createTcgDto,
    });

    return tcg;
  }

  async findAll() {
    const tcgs = await (this.prisma.tcgs as any).findMany({
      select: {
        id: true,
        name: true,
        display_name: true,
        is_active: true,
        logo_url: true,
        icon_url: true,
        loader_url: true,
        order: true,
        _count: { select: { singles: true, categories: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    // Enriquecer con el conteo total de artículos (suma de stock)
    const enrichedTcgs = await Promise.all(
      tcgs.map(async (tcg: any) => {
        const stockSum = await this.prisma.singles.aggregate({
          where: { tcg_id: tcg.id },
          _sum: { stock: true },
        });

        return {
          ...tcg,
          _count: {
            ...tcg._count,
            total_articles: stockSum._sum.stock || 0,
          },
        };
      }),
    );

    return enrichedTcgs;
  }

  async findActive() {
    const all = await this.findAll();
    return all.filter((t: any) => t.is_active);
  }

  async findOne(id: string) {
    const tcg = await this.prisma.tcgs.findUnique({
      where: { id },
      include: {
        singles: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!tcg) {
      throw new NotFoundException(`TCG with ID ${id} not found`);
    }

    return tcg;
  }

  async update(id: string, updateTcgDto: UpdateTcgDto) {
    // Check if TCG exists
    const tcg = await this.prisma.tcgs.findUnique({
      where: { id },
    });

    if (!tcg) {
      throw new NotFoundException(`TCG with ID ${id} not found`);
    }

    // If name is being updated, check for conflicts
    if (updateTcgDto.name && updateTcgDto.name !== tcg.name) {
      const existing = await this.prisma.tcgs.findUnique({
        where: { name: updateTcgDto.name },
      });

      if (existing) {
        throw new ConflictException('TCG with this name already exists');
      }
    }

    const updated = await (this.prisma.tcgs as any).update({
      where: { id },
      data: updateTcgDto,
    });

    // If it was active and now it's being deactivated, shift subsequent items down
    // and move this one to the end of the list
    if (tcg.is_active && updateTcgDto.is_active === false) {
      await this.reorderRemaining((tcg as any).order);
      const totalCount = await (this.prisma.tcgs as any).count();
      await (this.prisma.tcgs as any).update({
        where: { id },
        data: { order: totalCount } as any,
      });
    }

    return updated;
  }

  async remove(id: string) {
    const tcg = await this.prisma.tcgs.findUnique({
      where: { id },
      include: {
        singles: { select: { id: true } },
        categories: { select: { id: true } },
      },
    });

    if (!tcg) {
      throw new NotFoundException(`TCG with ID ${id} not found`);
    }

    const categoryIds = tcg.categories.map((c) => c.id);

    await this.prisma.$transaction(async (tx) => {
      // Delete all singles in every linked category (cleans up cross-TCG singles too)
      if (categoryIds.length > 0) {
        await tx.singles.deleteMany({ where: { category_id: { in: categoryIds } } });
      }
      // Also catch any singles for this TCG not covered above
      await tx.singles.deleteMany({ where: { tcg_id: id } });

      // Delete every category that belongs to this TCG
      if (categoryIds.length > 0) {
        await tx.categories.deleteMany({ where: { id: { in: categoryIds } } });
      }

      // Delete the TCG (cascade removes remaining junction rows)
      await tx.tcgs.delete({ where: { id } });
    });

    await this.reorderRemaining((tcg as any).order);

    return { id, singlesDeleted: tcg.singles.length, categoriesDeleted: categoryIds.length };
  }

  private async reorderRemaining(fromOrder: number) {
    await (this.prisma.tcgs as any).updateMany({
      where: {
        order: { gt: fromOrder },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });
  }
}
