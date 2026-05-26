import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService } from '../common/cache/cache.service.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';
import { UpdateBannerDto } from './dto/update-banner.dto.js';

@Injectable()
export class BannersService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createBannerDto: CreateBannerDto) {
    const banner = await this.prisma.banners.create({
      data: createBannerDto,
    });
    return banner;
  }

  async findAll() {
    return this.prisma.banners.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findActive(tcgId?: string) {
    // const cacheKey = `banners:${tcgId || 'global'}`;

    let finalTcgId = tcgId;

    // If tcgId is provided but not a valid UUID, try to resolve it from the tcgs table
    if (tcgId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tcgId)) {
      const tcg = await this.prisma.tcgs.findFirst({
        where: {
          OR: [
            { name: { equals: tcgId, mode: 'insensitive' } },
            { display_name: { equals: tcgId, mode: 'insensitive' } },
          ],
        },
      });
      finalTcgId = tcg?.id || undefined;
    }

    return this.prisma.banners.findMany({
      where: {
        is_active: true,
        ...(finalTcgId
          ? {
              OR: [{ tcg_id: null }, { tcg_id: finalTcgId }],
            }
          : {}), // If no tcgId, return all active banners
      },
      orderBy: { order: 'asc' },
    });
  }

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    try {
      const banner = await this.prisma.banners.update({
        where: { id },
        data: updateBannerDto,
      });
      return banner;
    } catch (_error) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const banner = await this.prisma.banners.delete({
        where: { id },
      });
      return banner;
    } catch (_error) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
  }
}
