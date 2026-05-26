import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { listing_status_enum, PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '@hydra/database';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

type PrismaWithSingles = PrismaClient & {
  singles: {
    count: (args?: { where?: { category_id: string } }) => Promise<number>;
  };
};

import { CacheService } from '@hydra/common';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.categories.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const { tcg_ids, ...rest } = createCategoryDto;

    // Build the data object with TCG connections
    const data: Prisma.categoriesCreateInput = {
      ...rest,
    };

    if (tcg_ids?.length) {
      const connections = tcg_ids.map((id) => ({ id }));
      // We try to connect to both relationships to maintain sync, but handle potential schema mismatch
      (data as any).tcgs = { connect: connections };
      (data as any).tcgs_categories_tcgs = { connect: connections };
    }

    const category = await this.prisma.categories.create({
      data,
      include: {
        tcgs: { select: { id: true, name: true, display_name: true } },
        tcgs_categories_tcgs: { select: { id: true, name: true, display_name: true } },
      },
    });

    // Merge duplicate relations for consistent response
    const mergedTcgs = [...(category.tcgs || []), ...(category.tcgs_categories_tcgs || [])];
    (category as any).tcgs = Array.from(new Map(mergedTcgs.map((t) => [t.id, t])).values());

    return category;
  }

  async findActive(tcgId?: string, includeEmpty = false) {
    try {
      // Step 1: Fetch all active categories with their TCGs
      let allActiveCategories: any[] = [];
      try {
        const rawCategories = await this.prisma.categories.findMany({
          where: { is_active: true },
          include: {
            tcgs: { select: { id: true } },
            tcgs_categories_tcgs: { select: { id: true } },
          },
          orderBy: { order: 'asc' },
        });
        // Merge duplicate relations for consistent results
        allActiveCategories = rawCategories.map((cat: any) => {
          const merged = [...(cat.tcgs || []), ...(cat.tcgs_categories_tcgs || [])];
          return {
            ...cat,
            tcgs: Array.from(new Map(merged.map((t) => [t.id, t])).values()),
          };
        });
      } catch (dbError) {
        this.logger.warn(
          `[CategoriesService] Primary tcgs relation failed, trying fallback: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        );
        try {
          allActiveCategories = await this.prisma.categories.findMany({
            where: { is_active: true },
            include: {
              tcgs_categories_tcgs: { select: { id: true } },
            },
            orderBy: { order: 'asc' },
          });
          // Map fallback results
          allActiveCategories = allActiveCategories.map((cat: any) => ({
            ...cat,
            tcgs: cat.tcgs_categories_tcgs || [],
          }));
        } catch (fallbackError) {
          this.logger.error('[CategoriesService] Both relations failed:', fallbackError);
          // If both fail, return empty list instead of crashing with 500
          allActiveCategories = [];
        }
      }

      // Step 2: Filter categories by TCG membership first
      const tcgFilteredCategories = allActiveCategories.filter((category) => {
        // Must have at least one TCG
        const tcgs = category.tcgs || [];
        if (tcgs.length === 0) return false;

        // If tcgId provided, must match one of the category's TCGs
        if (tcgId && !tcgs.some((t: any) => t.id === tcgId)) return false;

        return true;
      });

      // Step 3: If tcgId is provided and not includeEmpty, filter out categories with no singles for that TCG
      const result: any[] = [];
      for (const category of tcgFilteredCategories) {
        if (tcgId && !includeEmpty) {
          try {
            // Count singles for this category+tcg combination
            const singlesCount = await this.prisma.singles.count({
              where: {
                category_id: category.id,
                tcg_id: tcgId,
              },
            });
            if (singlesCount === 0) continue;
          } catch (countError) {
            this.logger.error(`Error counting singles for category ${category.id}`, countError);
            // Don't fail the whole request for one count error
            continue;
          }
        }

        // Remove tcgs field from result; resolve TCG-specific display_name if set
        const {
          tcgs: _tcgs,
          tcgs_categories_tcgs: _tcgs_fallback,
          tcg_display_names,
          ...rest
        } = category;
        const overrides = (tcg_display_names as Record<string, string> | null) ?? {};
        const display_name = tcgId && overrides[tcgId] ? overrides[tcgId] : rest.display_name;
        result.push({ ...rest, display_name });
      }

      return result;
    } catch (error) {
      this.logger.error('findActive error', error);
      throw error;
    }
  }

  async findWithProducts(tcgId?: string) {
    try {
      // Step 1: Fetch all active categories that are linked to this TCG
      let activeCategories;
      try {
        activeCategories = await this.prisma.categories.findMany({
          where: {
            is_active: true,
            OR: [
              { tcgs: tcgId ? { some: { id: tcgId } } : { some: {} } },
              { tcgs_categories_tcgs: tcgId ? { some: { id: tcgId } } : { some: {} } },
            ],
          },
          orderBy: { order: 'asc' },
          include: {
            tcgs: { select: { id: true, name: true, display_name: true } },
            tcgs_categories_tcgs: { select: { id: true, name: true, display_name: true } },
          },
        });
        // Merge duplicate relations for consistent results
        activeCategories = activeCategories.map((cat: any) => {
          const merged = [...(cat.tcgs || []), ...(cat.tcgs_categories_tcgs || [])];
          return {
            ...cat,
            tcgs: Array.from(new Map(merged.map((t) => [t.id, t])).values()),
          };
        });
      } catch (dbError) {
        this.logger.error('findWithProducts - Database Error in Step 1', dbError);
        this.logger.warn('findWithProducts - Attempting fallback relation...');
        try {
          activeCategories = await this.prisma.categories.findMany({
            where: {
              is_active: true,
              tcgs_categories_tcgs: tcgId ? { some: { id: tcgId } } : { some: {} },
            },
            orderBy: { order: 'asc' },
          });
        } catch (fallbackError) {
          this.logger.error('findWithProducts - Fallback also failed', fallbackError);
          throw dbError;
        }
      }

      // Step 2: For each category, check if it has matching products
      // We do this to avoid the complex deep-nested 'some' filter that fails with the adapter
      const categoriesWithProducts: any[] = [];

      for (const category of activeCategories) {
        const productCount = await this.prisma.singles.count({
          where: {
            category_id: category.id,
            AND: [
              ...(tcgId ? [{ tcg_id: tcgId }] : []),
              {
                OR: [
                  {
                    listings: {
                      some: {
                        status: listing_status_enum.ACTIVE,
                      },
                    },
                  },
                  {
                    isLocalInventory: true,
                    stock: { gt: 0 },
                  },
                ],
              },
            ],
          },
        });

        if (productCount > 0) {
          const { tcg_display_names, ...categoryRest } = category;
          const overrides = (tcg_display_names as Record<string, string> | null) ?? {};
          const display_name =
            tcgId && overrides[tcgId] ? overrides[tcgId] : categoryRest.display_name;
          categoriesWithProducts.push({
            ...categoryRest,
            display_name,
            _count: { singles: productCount },
          });
        }
      }

      return categoriesWithProducts;
    } catch (error) {
      this.logger.error('findWithProducts error', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const [rawCategory, singlesCount] = await Promise.all([
      this.prisma.categories.findUnique({
        where: { id },
        include: {
          tcgs: { select: { id: true, name: true, display_name: true } },
          tcgs_categories_tcgs: { select: { id: true, name: true, display_name: true } },
        },
      }),
      (this.prisma as unknown as PrismaWithSingles).singles.count({
        where: { category_id: id },
      }),
    ]);

    if (!rawCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Merge duplicate relations for consistent response
    const mergedTcgs = [...(rawCategory.tcgs || []), ...(rawCategory.tcgs_categories_tcgs || [])];
    const category = {
      ...rawCategory,
      tcgs: Array.from(new Map(mergedTcgs.map((t) => [t.id, t])).values()),
    };

    return {
      ...category,
      _count: {
        singles: singlesCount,
      },
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.categories.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.prisma.categories.findUnique({
        where: { name: updateCategoryDto.name },
      });
      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const { tcg_ids, ...rest } = updateCategoryDto;

    const data: Prisma.categoriesUpdateInput = {
      ...rest,
    };

    if (Array.isArray(tcg_ids)) {
      const connections = tcg_ids.map((tcgId) => ({ id: tcgId }));
      // Use 'set' to replace current relations with the new list
      (data as any).tcgs = { set: connections };
      (data as any).tcgs_categories_tcgs = { set: connections };
    }

    const updated = await this.prisma.categories.update({
      where: { id },
      data,
      include: {
        tcgs: { select: { id: true, name: true, display_name: true } },
        tcgs_categories_tcgs: { select: { id: true, name: true, display_name: true } },
      },
    });

    // Merge duplicate relations for consistent response
    const mergedTcgs = [...(updated.tcgs || []), ...(updated.tcgs_categories_tcgs || [])];
    (updated as any).tcgs = Array.from(new Map(mergedTcgs.map((t) => [t.id, t])).values());

    return updated;
  }

  async remove(id: string) {
    const category = await this.prisma.categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const singlesCount = await (this.prisma as unknown as PrismaWithSingles).singles.count({
      where: { category_id: id },
    });

    if (singlesCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ID ${id} because it has ${singlesCount} associated singles`,
      );
    }

    const deleted = await this.prisma.categories.delete({
      where: { id },
    });
    return deleted;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    cacheKey?: string;
  }) {
    const where: Prisma.categoriesWhereInput = {};
    if (options?.isActive) where.is_active = options.isActive;
    if (options?.search) where.name = { contains: options.search, mode: 'insensitive' };

    // Fetch categories without the Prisma _count to handle it manually and more reliably
    const rawCategories = await this.prisma.categories.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        tcgs: { select: { id: true, name: true, display_name: true } },
        tcgs_categories_tcgs: { select: { id: true, name: true, display_name: true } },
      },
    });

    // Merge duplicate relations for consistent results
    const categories = rawCategories.map((cat: any) => {
      const merged = [...(cat.tcgs || []), ...(cat.tcgs_categories_tcgs || [])];
      return {
        ...cat,
        tcgs: Array.from(new Map(merged.map((t) => [t.id, t])).values()),
      };
    });

    // Manually calculate counts for each category to ensure they are present in the final JSON
    // and bypass any potential stripping of Prisma's internal _count field
    return Promise.all(
      categories.map(async (cat) => {
        const [totalSingles, localSingles] = await Promise.all([
          this.prisma.singles.count({
            where: { category_id: cat.id },
          }),
          this.prisma.singles.count({
            where: {
              category_id: cat.id,
              isLocalInventory: true,
              stock: { gt: 0 },
            },
          }),
        ]);

        return {
          ...cat,
          _count: {
            singles: totalSingles,
            local_singles: localSingles,
          },
        };
      }),
    );
  }

  async toggleActive(id: string) {
    const category = await this.prisma.categories.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const updated = await this.prisma.categories.update({
      where: { id },
      data: { is_active: !category.is_active },
    });
    return updated;
  }

  async bulkCreate(dtos: CreateCategoryDto[]) {
    const result = await this.prisma.$transaction(
      dtos.map((dto) => this.prisma.categories.create({ data: dto })),
    );
    return result;
  }

  async reorder(items: { id: string; order: number }[]) {
    const result = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.categories.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
    return result;
  }
}
