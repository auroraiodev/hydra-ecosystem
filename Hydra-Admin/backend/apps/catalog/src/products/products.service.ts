import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@hydra/database';
import { CreateSingleDto } from './dto/create-single.dto.js';
import { UpdateSingleDto } from './dto/update-single.dto.js';
import { ImportationService } from '../importation/importation.service.js';
import { CurrencyService } from '../importation/currency.service.js';
import { UserWithRole } from '@hydra/auth';
import { CacheService } from '@hydra/common';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly importationService: ImportationService,
    private readonly currencyService: CurrencyService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  private async invalidateAndNotify(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidateProductCache(),
      this.cacheService.invalidateHomePage(),
    ]);
  }

  async createBundle(createDto: any, user: UserWithRole) {
    const {
      owner_id,
      category_id,
      condition_id,
      language_id,
      importationId,
      finalPrice,
      cardName,
      cardNumber,
      expansion,
      borderless,
      extendedArt,
      foil,
      img,
      isLocalInventory,
      prerelease,
      stock,
      surgeFoil,
      tags,
    } = createDto;

    // Verify owner exists
    const owner = await this.prisma.users.findUnique({
      where: { id: owner_id },
    });
    if (!owner) throw new NotFoundException(`User with ID ${owner_id} not found`);

    // Verify category exists
    const category = await this.prisma.categories.findUnique({
      where: { id: category_id },
    });
    if (!category) throw new NotFoundException(`Category with ID ${category_id} not found`);

    // Verify condition if present
    if (condition_id) {
      const condition = await this.prisma.conditions.findUnique({ where: { id: condition_id } });
      if (!condition) throw new NotFoundException(`Condition with ID ${condition_id} not found`);
    }

    // Verify language if present
    if (language_id) {
      const language = await this.prisma.languages.findUnique({ where: { id: language_id } });
      if (!language) throw new NotFoundException(`Language with ID ${language_id} not found`);
    }

    // Verify owner if SELLER (cannot create for someone else)
    if (user.role.name === 'SELLER' && owner_id !== user.id) {
      throw new ForbiddenException('You can only create listings for yourself');
    }

    let priceValue = finalPrice || 0;

    // Price Protection: If importationId is present, fetch the correct price from Importation
    // For local inventory items, use the local price (base + profit, no import fee)
    if (importationId) {
      const importationPrice = await this.importationService.getPriceForSingle({
        importationId: importationId,
        is_foil: foil || false,
        language: null,
        name: cardName,
        isLocalInventory: isLocalInventory ?? true,
      });
      if (importationPrice !== null) {
        priceValue = importationPrice;
      }
    }

    // Default TCG (Magic) logic
    let tcgId = createDto.tcg_id;
    if (!tcgId) {
      const magicTcg = await this.prisma.tcgs.findUnique({ where: { name: 'MAGIC' } });
      if (magicTcg) tcgId = magicTcg.id;
    } else {
      const tcg = await this.prisma.tcgs.findUnique({ where: { id: tcgId } });
      if (!tcg) throw new NotFoundException(`TCG with ID ${tcgId} not found`);
    }

    // Checking for duplicates (similar to create logic but handles nullable fields)
    const whereClause: any = {
      owner_id,
      foil: foil || false,
    };
    if (condition_id) whereClause.condition_id = condition_id;
    if (language_id) whereClause.language_id = language_id;

    if (importationId) {
      whereClause.importationId = importationId;
    } else {
      whereClause.cardName = cardName;
      if (expansion) whereClause.expansion = expansion;
    }

    const potentialMatches = await this.prisma.singles.findMany({
      where: whereClause,
      include: { tags: { include: { tags: true } } },
    });

    // Merge stock into first matching product regardless of tags.
    // Tags are metadata — they should not prevent stock consolidation for
    // the same physical card (same owner, condition, language, foil, and ID/name+set).
    if (potentialMatches.length > 0) {
      const match = potentialMatches[0];
      const updatedProduct = await this.prisma.singles.update({
        where: { id: match.id },
        data: { stock: match.stock + (stock || 0) },
        include: {
          categories: true,
          conditions: true,
          languages: true,
          tcgs: true,
          owner: { include: { roles: true } },
          tags: { include: { tags: true } },
        },
      });
      const result = { ...updatedProduct, tags: updatedProduct.tags.map((st) => st.tags) };
      return result;
    }

    // Create
    try {
      const product = await this.prisma.singles.create({
        data: {
          price: priceValue,
          category_id,
          condition_id: condition_id || null,
          language_id: language_id || null,
          tcg_id: tcgId,
          owner_id,
          borderless,
          cardName,
          cardNumber,
          expansion,
          extendedArt,
          foil,
          importationId,
          img,
          isLocalInventory: isLocalInventory ?? true,
          prerelease,
          stock: stock || 0,
          surgeFoil,
        },
        include: {
          categories: true,
          conditions: true,
          languages: true,
          tcgs: true,
          owner: { include: { roles: true } },
        },
      });

      // Tags logic (same as create)
      if (tags && tags.length > 0) {
        const tagPromises = tags.map(async (tagName: string) => {
          let tag = await this.prisma.tags.findUnique({ where: { name: tagName } });
          if (!tag) {
            tag = await this.prisma.tags.create({
              data: { name: tagName, display_name: tagName, is_active: true, is_default: false },
            });
          }
          return tag;
        });
        const tagRecords = await Promise.all(tagPromises);
        if (tagRecords.length > 0) {
          await this.prisma.single_tags.createMany({
            data: tagRecords.map((t) => ({ single_id: product.id, tag_id: t.id })),
          });
        }
      }

      const productWithTags = await this.prisma.singles.findUnique({
        where: { id: product.id },
        include: {
          categories: true,
          conditions: true,
          languages: true,
          tcgs: true,
          owner: { include: { roles: true } },
          tags: { include: { tags: true } },
        },
      });

      if (productWithTags) {
        const result = { ...productWithTags, tags: productWithTags.tags.map((st) => st.tags) };
        return result;
      }
      return product;
    } catch (error) {
      throw new BadRequestException(
        `Failed to create bundle: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async create(createDto: CreateSingleDto, user: UserWithRole) {
    const {
      owner_id,
      category_id,
      condition_id,
      language_id,
      importationId,
      finalPrice,
      cardName,
      cardNumber,
      expansion,
      borderless,
      extendedArt,
      foil,
      img,
      isLocalInventory,
      stock,
      surgeFoil,
      tags,
      isSerialized,
      isAlternateFrame,
      isShowcase,
      priceMxnImportation,
      priceMxnLocal,
    } = createDto;

    // Verify owner exists
    const owner = await this.prisma.users.findUnique({
      where: { id: owner_id },
    });

    if (!owner) {
      throw new NotFoundException(`User with ID ${owner_id} not found`);
    }

    // Verify owner if SELLER (cannot create for someone else)
    if (user.role.name === 'SELLER' && owner_id !== user.id) {
      throw new ForbiddenException('You can only create listings for yourself');
    }

    // Verify category exists
    const category = await this.prisma.categories.findUnique({
      where: { id: category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    }

    // Verify condition exists
    const condition = await this.prisma.conditions.findUnique({
      where: { id: condition_id },
    });
    if (!condition) {
      throw new NotFoundException(`Condition with ID ${condition_id} not found`);
    }

    // Verify language exists
    const language = await this.prisma.languages.findUnique({
      where: { id: language_id },
    });
    if (!language) {
      throw new NotFoundException(`Language with ID ${language_id} not found`);
    }

    // For local inventory, store the local price (base + profit, no import fee).
    // For importation products, store finalPrice which includes the import fee.
    const price =
      isLocalInventory && priceMxnLocal && priceMxnLocal > 0 ? priceMxnLocal : finalPrice || 0;

    // Get or set default TCG (Magic) if not provided
    let tcgId = createDto.tcg_id;
    if (!tcgId) {
      const magicTcg = await this.prisma.tcgs.findUnique({
        where: { name: 'MAGIC' },
      });
      if (magicTcg) {
        tcgId = magicTcg.id;
      }
    } else {
      // Verify TCG exists if provided
      const tcg = await this.prisma.tcgs.findUnique({
        where: { id: tcgId },
      });
      if (!tcg) {
        throw new NotFoundException(`TCG with ID ${tcgId} not found`);
      }
    }

    // Checking for duplicates: same owner, same importationId (if available), or same name/set/foil/condition/language
    const whereClause: any = {
      owner_id,
      condition_id,
      language_id,
      foil: foil || false,
    };

    if (importationId) {
      whereClause.importationId = importationId;
    } else {
      whereClause.cardName = cardName;
      if (expansion) {
        whereClause.expansion = expansion;
      }
    }

    const potentialMatches = await this.prisma.singles.findMany({
      where: whereClause,
      include: {
        tags: {
          include: {
            tags: true,
          },
        },
      },
    });

    if (potentialMatches.length > 0) {
      const match = potentialMatches[0];
      const updatedProduct = await this.prisma.singles.update({
        where: { id: match.id },
        data: {
          stock: match.stock + (stock || 0),
        },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              display_name: true,
              description: true,
              is_active: true,
              order: true,
            },
          },
          conditions: true,
          languages: true,
          tcgs: true,
          owner: {
            include: {
              roles: true,
            },
          },
          tags: {
            include: {
              tags: true,
            },
          },
        },
      });

      const result = {
        ...updatedProduct,
        tags: updatedProduct.tags.map((st) => st.tags),
      };
      return result;
    }

    // Create product
    try {
      const product = await this.prisma.singles.create({
        data: {
          price: price,
          category_id,
          condition_id,
          language_id,
          tcg_id: tcgId,
          owner_id,
          borderless,
          cardName,
          cardNumber,
          expansion,
          extendedArt,
          foil,
          importationId,
          img,
          isLocalInventory: isLocalInventory ?? true,
          stock: stock || 0,
          surgeFoil,
          isSerialized: isSerialized ?? false,
          isAlternateFrame: isAlternateFrame ?? false,
          isShowcase: isShowcase ?? false,
          priceMxnImportation: priceMxnImportation || null,
          priceMxnLocal: priceMxnLocal || null,
        },
      });

      // Handle tags
      if (tags && tags.length > 0) {
        const tagPromises = tags.map(async (tagName) => {
          let tag = await this.prisma.tags.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await this.prisma.tags.create({
              data: {
                name: tagName,
                display_name: tagName,
                is_active: true,
                is_default: false,
              },
            });
          }

          return tag;
        });

        const tagRecords = await Promise.all(tagPromises);

        // Get tag IDs
        const tagIds = tagRecords.map((tag) => tag.id);

        // Create relationships in single_tags
        if (tagIds.length > 0) {
          await this.prisma.single_tags.createMany({
            data: tagIds.map((tagId) => ({
              single_id: product.id,
              tag_id: tagId,
            })),
          });
        }
      }

      // Return product with tags
      const productWithTags = await this.prisma.singles.findUnique({
        where: { id: product.id },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              display_name: true,
              description: true,
              is_active: true,
              order: true,
            },
          },
          conditions: true,
          languages: true,
          tcgs: true,
          owner: {
            include: {
              roles: true,
            },
          },
          tags: {
            include: {
              tags: true,
            },
          },
        },
      });

      // Transform tags from single_tags[] to tags[]
      if (productWithTags) {
        const result = {
          ...productWithTags,
          tags: productWithTags.tags.map((st) => st.tags),
        };
        return result;
      }

      return product;
    } catch (error) {
      throw new BadRequestException(
        `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createBulk(createDtos: CreateSingleDto[], user: UserWithRole) {
    const results = {
      created: [] as any[],
      failed: [] as Array<{ product: CreateSingleDto; error: string }>,
    };

    for (const createDto of createDtos) {
      try {
        const product = await this.create(createDto, user);
        results.created.push(product);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({
          product: createDto,
          error: errorMessage,
        });
      }
    }

    return {
      success: results.failed.length === 0,
      created: results.created,
      failed: results.failed,
      total: createDtos.length,
      createdCount: results.created.length,
      failedCount: results.failed.length,
    };
  }

  async updateFromImportation(productId: string, updateDto: CreateSingleDto) {
    const {
      category_id,
      condition_id,
      language_id,
      finalPrice,
      cardName,
      cardNumber,
      expansion,
      borderless,
      extendedArt,
      foil,
      img,
      isLocalInventory,
      stock,
      surgeFoil,
      tags,
    } = updateDto;

    // Verify product exists
    const existing = await this.prisma.singles.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Verify category exists
    const category = await this.prisma.categories.findUnique({
      where: { id: category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    }

    // Verify condition exists
    const condition = await this.prisma.conditions.findUnique({
      where: { id: condition_id },
    });
    if (!condition) {
      throw new NotFoundException(`Condition with ID ${condition_id} not found`);
    }

    // Verify language exists
    const language = await this.prisma.languages.findUnique({
      where: { id: language_id },
    });
    if (!language) {
      throw new NotFoundException(`Language with ID ${language_id} not found`);
    }

    // Use finalPrice for the price
    const price = finalPrice || 0;

    // Get or set default TCG (Magic) if not provided
    let tcgId = updateDto.tcg_id;
    if (tcgId === undefined) {
      // If tcg_id is not in the update, keep existing or set to Magic
      const currentProduct = await this.prisma.singles.findUnique({
        where: { id: productId },
        select: { tcg_id: true },
      });
      if (!currentProduct?.tcg_id) {
        const magicTcg = await this.prisma.tcgs.findUnique({
          where: { name: 'MAGIC' },
        });
        if (magicTcg) {
          tcgId = magicTcg.id;
        }
      } else {
        tcgId = currentProduct.tcg_id;
      }
    } else if (tcgId !== null) {
      // Verify TCG exists if provided
      const tcg = await this.prisma.tcgs.findUnique({
        where: { id: tcgId },
      });
      if (!tcg) {
        throw new NotFoundException(`TCG with ID ${tcgId} not found`);
      }
    }

    // Update product with new schema structure
    const product = await this.prisma.singles.update({
      where: { id: productId },
      data: {
        price: price,
        category_id,
        condition_id,
        language_id,
        tcg_id: tcgId,
        borderless,
        cardName,
        cardNumber,
        expansion,
        extendedArt,
        foil,
        img,
        isLocalInventory,
        stock: stock || 0,
        surgeFoil,
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: {
          include: {
            roles: true,
          },
        },
      },
    });

    // Handle tags if provided
    if (tags && tags.length > 0) {
      // Get or create tags
      const tagPromises = tags.map(async (tagName) => {
        // Try to find existing tag
        let tag = await this.prisma.tags.findUnique({
          where: { name: tagName },
        });

        // If tag doesn't exist, create it
        if (!tag) {
          tag = await this.prisma.tags.create({
            data: {
              name: tagName,
              display_name: tagName,
              is_active: true,
              is_default: false,
            },
          });
        }

        return tag;
      });

      const tagRecords = await Promise.all(tagPromises);

      // Get tag IDs
      const tagIds = tagRecords.map((tag) => tag.id);

      // Remove all existing tags for this product
      await this.prisma.single_tags.deleteMany({
        where: { single_id: productId },
      });

      // Create new relationships in single_tags
      if (tagIds.length > 0) {
        await this.prisma.single_tags.createMany({
          data: tagIds.map((tagId) => ({
            single_id: productId,
            tag_id: tagId,
          })),
        });
      }
    }

    // Return product with tags
    const productWithTags = await this.prisma.singles.findUnique({
      where: { id: productId },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: {
          include: {
            roles: true,
          },
        },
        tags: {
          include: {
            tags: true,
          },
        },
      },
    });

    // Transform tags from single_tags[] to tags[]
    if (productWithTags) {
      return {
        ...productWithTags,
        tags: productWithTags.tags.map((st) => st.tags),
      };
    }

    return product;
  }

  async findByOwner(ownerId: string, page: number = 1, limit: number = 20) {
    // Verify owner exists
    const owner = await this.prisma.users.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException(`User with ID ${ownerId} not found`);
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.singles.findMany({
        where: { owner_id: ownerId },
        skip,
        take: limit,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              display_name: true,
              description: true,
              is_active: true,
              order: true,
            },
          },
          conditions: true,
          languages: true,
          tcgs: true,
          owner: {
            include: {
              roles: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.singles.count({
        where: { owner_id: ownerId },
      }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    filters?: {
      conditions?: string[];
      languages?: string[];
      minPrice?: number;
      maxPrice?: number;
      category?: string;
      tcgId?: string;
      expansion?: string;
      inStock?: boolean;
      ownerId?: string;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search && search.trim() !== '') {
      where.OR = [{ cardName: { contains: search.trim(), mode: 'insensitive' } }];
    }

    if (filters) {
      if (filters.category) where.category_id = filters.category;
      if (filters.tcgId) where.tcg_id = filters.tcgId;
      if (filters.expansion) where.expansion = { contains: filters.expansion, mode: 'insensitive' };

      if (filters.conditions && filters.conditions.length > 0) {
        where.conditions = { name: { in: filters.conditions, mode: 'insensitive' } };
      }
      if (filters.languages && filters.languages.length > 0) {
        where.languages = { name: { in: filters.languages, mode: 'insensitive' } };
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }

      if (filters.inStock) where.stock = { gt: 0 };
      if (filters.ownerId) where.owner_id = filters.ownerId;
    }

    const products = await this.prisma.singles.findMany({
      where,
      skip,
      take: limit,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: { include: { roles: true } },
        tags: { include: { tags: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const transformedProducts = products.map((product) => ({
      ...product,
      tags: product.tags.map((st: any) => st.tags),
    }));

    const totalCount = await this.prisma.singles.count({ where });

    return {
      data: transformedProducts,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getUniqueExpansions() {
    const expansions = await this.prisma.singles.groupBy({
      by: ['expansion'],
      where: {
        expansion: { not: null },
      },
    });
    return expansions.map((e) => e.expansion).filter(Boolean);
  }

  async findLocal(page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.singles.findMany({
        where: {
          isLocalInventory: true,
        },
        skip,
        take: limit,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              display_name: true,
              description: true,
              is_active: true,
              order: true,
            },
          },
          conditions: true,
          languages: true,
          tcgs: true,
          owner: {
            include: {
              roles: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.singles.count({
        where: {
          isLocalInventory: true,
        },
      }),
    ]);

    const excludedIds = await this.importationService.filterProductsWithoutImportationStock(
      products as any[],
    );
    const updatedProducts = products.filter((p) => !excludedIds.has(String(p.id)));

    return {
      data: updatedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAllProductsToLocalInventory(): Promise<{
    success: boolean;
    updated: number;
    message: string;
  }> {
    try {
      const result = await this.prisma.singles.updateMany({
        where: {
          isLocalInventory: false,
        },
        data: {
          isLocalInventory: true,
        },
      });

      return {
        success: true,
        updated: result.count,
        message: `Successfully updated ${result.count} products to have isLocalInventory=true`,
      };
    } catch (error) {
      this.logger.error(
        `Error updating products isLocalInventory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException(
        `Failed to update products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private normalizeLanguageForComparison(lang: string | undefined | null): string {
    if (!lang) return 'ENGLISH';
    const upperLang = lang.toUpperCase().trim();

    const codeMap: Record<string, string> = {
      JP: 'JAPANESE',
      EN: 'ENGLISH',
      ES: 'SPANISH',
      FR: 'FRENCH',
      DE: 'GERMAN',
      IT: 'ITALIAN',
      PT: 'PORTUGUESE',
      RU: 'RUSSIAN',
      KO: 'KOREAN',
      CS: 'CHINESE',
      CT: 'CHINESE',
      AG: 'ENGLISH',
    };

    const nameMap: Record<string, string> = {
      JAPONÉS: 'JAPANESE',
      JAPANESE: 'JAPANESE',
      INGLÉS: 'ENGLISH',
      ENGLISH: 'ENGLISH',
      ESPAÑOL: 'SPANISH',
      SPANISH: 'SPANISH',
    };

    return codeMap[upperLang] || nameMap[upperLang] || upperLang;
  }

  async findByName(name: string, tcgId?: string, filters: any = {}) {
    // For double-faced cards (e.g. "Norman Osborn // Green Goblin"), local products are
    // stored with just the front-face name. Use both the full query and the front-face
    // name so we don't miss them.
    const trimmed = name.trim();
    const searchTerms: string[] = [trimmed];
    if (trimmed.includes(' // ')) {
      const frontFace = trimmed.split(' // ')[0].trim();
      if (frontFace && frontFace !== trimmed) {
        searchTerms.push(frontFace);
      }
    }

    // Name match condition: for DFC queries, match on full name OR front-face name; also search cardName
    const nameClause =
      searchTerms.length > 1
        ? {
            OR: searchTerms.flatMap((t) => [
              { cardName: { contains: t, mode: 'insensitive' as const } },
            ]),
          }
        : {
            OR: [{ cardName: { contains: trimmed, mode: 'insensitive' as const } }],
          };

    // Stock/inventory condition: non-local items always show; local items only if in stock
    const inventoryClause = {
      OR: [
        { isLocalInventory: { not: true } },
        { AND: [{ isLocalInventory: true }, { stock: { gt: 0 } }] },
      ],
    };

    const where: any = {
      AND: [nameClause, inventoryClause],
    };

    // Apply TCG filter - allow specific TCG OR null (generic accessories)
    if (tcgId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ tcg_id: tcgId }, { tcg_id: null }],
        },
      ];
    }

    if (filters.conditions && filters.conditions.length > 0) {
      where.conditions = {
        OR: [
          { name: { in: filters.conditions, mode: 'insensitive' } },
          { display_name: { in: filters.conditions, mode: 'insensitive' } },
        ],
      };
    }

    if (filters.languages && filters.languages.length > 0) {
      where.languages = {
        OR: [
          { code: { in: filters.languages, mode: 'insensitive' } },
          { name: { in: filters.languages, mode: 'insensitive' } },
          { display_name: { in: filters.languages, mode: 'insensitive' } },
        ],
      };
    }

    if (filters.foil !== undefined) {
      where.foil = filters.foil;
    }

    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.expansions && filters.expansions.length > 0) {
      where.expansion = {
        in: filters.expansions,
        mode: 'insensitive',
      };
    }

    const products = await this.prisma.singles.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: {
          include: {
            roles: true,
          },
        },
        tags: {
          include: {
            tags: true,
          },
        },
      },
    });

    const transformedProducts = products.map((product) => ({
      ...product,
      tags: Array.isArray(product.tags)
        ? product.tags.map((st: any) => st?.tags).filter(Boolean)
        : [],
    }));

    const excludedIds =
      await this.importationService.filterProductsWithoutImportationStock(transformedProducts);
    const filteredProducts = transformedProducts.filter((p) => !excludedIds.has(String(p.id)));

    return filteredProducts;
  }

  async findLatest(limit: number = 12, page: number = 1, category?: string, tcgId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (tcgId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ tcg_id: tcgId }, { tcg_id: null }],
        },
      ];
    }

    if (category) {
      const categoryRecord = await this.prisma.categories.findFirst({
        where: {
          OR: [
            { name: { equals: category, mode: 'insensitive' } },
            { display_name: { equals: category, mode: 'insensitive' } },
          ],
        },
      });
      if (categoryRecord) where.category_id = categoryRecord.id;
    }

    where.OR = [
      { isLocalInventory: { not: true } },
      { AND: [{ isLocalInventory: true }, { importationId: { not: null } }, { stock: { gt: 0 } }] },
      {
        AND: [
          { isLocalInventory: true },
          { stock: { gt: 0 } },
          { categories: { name: { mode: 'insensitive', not: { equals: 'SINGLES' } } } },
        ],
      },
    ];

    const products = await this.prisma.singles.findMany({
      where,
      skip,
      take: limit,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: { include: { roles: true } },
        tags: { include: { tags: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const transformedProducts = products.map((product) => ({
      ...product,
      tags: Array.isArray(product.tags)
        ? product.tags.map((st: any) => st?.tags).filter(Boolean)
        : [],
    }));

    const excludedIds =
      await this.importationService.filterProductsWithoutImportationStock(transformedProducts);
    return transformedProducts.filter((p) => !excludedIds.has(String(p.id)));
  }

  async countByCategory(category: string, tcgId?: string): Promise<number> {
    const categoryRecord = await this.prisma.categories.findFirst({
      where: {
        OR: [
          { name: { equals: category, mode: 'insensitive' } },
          { display_name: { equals: category, mode: 'insensitive' } },
        ],
      },
    });

    if (!categoryRecord) return 0;

    const isSingles = categoryRecord.name.toUpperCase() === 'SINGLES';

    if (isSingles) {
      return this.prisma.singles.count({
        where: {
          category_id: categoryRecord.id,
          AND: [
            {
              OR: [{ tcg_id: tcgId }, { tcg_id: null }],
            },
            {
              OR: [
                { isLocalInventory: { not: true } },
                {
                  AND: [
                    { isLocalInventory: true },
                    { importationId: { not: null } },
                    { stock: { gt: 0 } },
                  ],
                },
              ],
            },
          ],
        },
      });
    }

    return this.prisma.singles.count({
      where: {
        category_id: categoryRecord.id,
        OR: [{ tcg_id: tcgId }, { tcg_id: null }],
      },
    });
  }

  async findByMetadata(metadata: string, limit: number = 12, page: number = 1, tcgId?: string) {
    const skip = (page - 1) * limit;
    const normalizedMetadata = metadata.charAt(0).toUpperCase() + metadata.slice(1).toLowerCase();

    const where: any = {
      AND: [
        { tags: { some: { tags: { name: { equals: normalizedMetadata, mode: 'insensitive' } } } } },
        {
          OR: [
            { isLocalInventory: { not: true } },
            {
              AND: [
                { isLocalInventory: true },
                { importationId: { not: null } },
                { stock: { gt: 0 } },
              ],
            },
            {
              AND: [
                { isLocalInventory: true },
                { stock: { gt: 0 } },
                { categories: { name: { mode: 'insensitive', not: { equals: 'SINGLES' } } } },
              ],
            },
          ],
        },
      ],
    };

    if (tcgId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ tcg_id: tcgId }, { tcg_id: null }],
        },
      ];
    }

    const products = await this.prisma.singles.findMany({
      skip,
      take: limit,
      where,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: { include: { roles: true } },
        tags: { include: { tags: true } },
      },
      orderBy: [
        metadata.toLowerCase() === 'cedh staple' ? { created_at: 'desc' } : { price: 'desc' },
      ],
    });

    const transformedProducts = products.map((product) => ({
      ...product,
      tags: product.tags.map((st: any) => st.tags),
    }));

    const excludedIds =
      await this.importationService.filterProductsWithoutImportationStock(transformedProducts);
    return transformedProducts.filter((p) => !excludedIds.has(String(p.id)));
  }

  async findByImportationId(importationId: string, cardName?: string, language?: string) {
    const where: any = { importationId };
    if (cardName) where.cardName = { contains: cardName, mode: 'insensitive' };

    const products = await this.prisma.singles.findMany({
      where,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: { include: { roles: true } },
        tags: { include: { tags: true } },
      },
    });

    // Product exists in local DB — existing path
    if (products.length > 0) {
      let product = products[0];

      if (language && products.length > 1) {
        const langMatch = products.find((p) => {
          const langName = (p.languages?.name || p.language || '').toLowerCase();
          return langName.includes(language.toLowerCase()) || langName === language.toLowerCase();
        });
        if (langMatch) product = langMatch;
      }

      const productWithTags = { ...product, tags: product.tags.map((st: any) => st.tags) };

      const excludedIds = await this.importationService.filterProductsWithoutImportationStock([
        productWithTags,
      ] as any[]);
      if (excludedIds.has(String(productWithTags.id))) {
        productWithTags.stock = 0;
      }

      return {
        ...productWithTags,
        category: product.categories?.name || 'SINGLES',
        tcg:
          product.tcgs?.name ||
          (product.tcg_id === 'bd789d3f-5569-4971-890e-e261e145e42c' ? 'MAGIC' : 'OTHER'),
        tcgId: product.tcg_id,
        price_mxn_local: product.priceMxnLocal ? Number(product.priceMxnLocal) : undefined,
        price_mxn_importation: product.priceMxnImportation
          ? Number(product.priceMxnImportation)
          : undefined,
      };
    }

    // Not in local DB — fall back to the importation/mtgsrc service
    if (cardName) {
      try {
        const importResult = await this.importationService.searchCards({
          query: cardName,
          language,
          rows: 60,
          includeOutOfStock: true,
        });

        const match = importResult.data.find((item) => item.importationId === importationId);

        if (match) {
          return {
            id: importationId,
            cardName: match.cardName,
            name: match.cardName,
            price: match.finalPrice ?? match.price_mxn_importation ?? 0,
            stock: match.stock,
            imageUrl: match.img,
            img: match.img,
            expansion: match.expansion || '',
            expansionCode: match.expansionCode,
            foil: match.foil,
            surgeFoil: match.surgeFoil,
            language: match.language,
            condition: match.condition,
            importationId: match.importationId,
            isLocalInventory: false,
            price_mxn_importation: match.price_mxn_importation,
            price_mxn_local: match.price_mxn_local,
            languages: { name: match.language, display_name: match.language },
            conditions: { name: match.condition, display_name: match.condition },
            categories: {
              name: match.category || 'SINGLES',
              display_name: match.category || 'Singles',
            },
            tags: [],
            category: match.category || 'SINGLES',
            tcg: 'MAGIC',
            tcgId: 'bd789d3f-5569-4971-890e-e261e145e42c',
            metadata: match.metadata || [],
          };
        }
      } catch (e) {
        this.logger.warn(
          `[findByImportationId] Importation fallback failed for ${importationId}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    throw new NotFoundException(`Product with importation ID ${importationId} not found`);
  }

  async findOne(id: string) {
    const product = await this.prisma.singles.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            display_name: true,
            description: true,
            is_active: true,
            order: true,
          },
        },
        conditions: true,
        languages: true,
        tcgs: true,
        owner: { include: { roles: true } },
        tags: { include: { tags: true } },
      },
    });

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const productWithTags = {
      ...product,
      tags: product.tags.map((st: any) => st.tags),
    };

    const excludedIds = await this.importationService.filterProductsWithoutImportationStock([
      productWithTags,
    ] as any[]);

    if (excludedIds.has(String(productWithTags.id))) {
      productWithTags.stock = 0;
    }

    const productAny = product as any;
    if (productAny.conditions && productAny.conditions.discount > 0) {
      const discountPercent = productAny.conditions.discount;
      const basePrice = Number(productWithTags.price);
      const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
      productWithTags.price = new Prisma.Decimal(discountedPrice);
    }

    const productFinal = {
      ...productWithTags,
      category: product.categories?.name || 'SINGLES',
      tcg:
        product.tcgs?.name ||
        (product.tcg_id === 'bd789d3f-5569-4971-890e-e261e145e42c' ? 'MAGIC' : 'OTHER'),
      tcgId: product.tcg_id,
      // Expose snake_case aliases so the frontend price-selection logic works
      price_mxn_local: product.priceMxnLocal ? Number(product.priceMxnLocal) : undefined,
      price_mxn_importation: product.priceMxnImportation
        ? Number(product.priceMxnImportation)
        : undefined,
    };

    return productFinal;
  }

  async remove(id: string, user: UserWithRole) {
    const product = await this.prisma.singles.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    if (user.role.name !== 'ADMIN' && product.owner_id !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.single_tags.deleteMany({ where: { single_id: id } });
      await tx.cart_items.updateMany({ where: { single_id: id }, data: { single_id: null } });
      await tx.listings.deleteMany({ where: { single_id: id } });
      await tx.order_items.deleteMany({ where: { single_id: id } });
      await tx.singles.delete({ where: { id } });
    });

    await this.invalidateAndNotify();
    return { message: `Product with ID ${id} has been deleted successfully` };
  }

  async updateTags(productId: string, tagNames: string[], user: UserWithRole) {
    // Guard: only forward valid UUIDs to Prisma — stale localStorage entries
    // can contain importation composite IDs (e.g. "98097-Inglés-7") that cause
    // a P2007 invalid input syntax error on the UUID column.
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }

    // Remove duplicate tag names to prevent unique constraint violations
    // when creating single_tags relationships
    const uniqueTagNames = [...new Set(tagNames)];

    const product = await this.prisma.singles.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);

    if (user.role.name !== 'ADMIN' && product.owner_id !== user.id) {
      throw new ForbiddenException('You do not have permission to update tags for this product');
    }

    const tagPromises = uniqueTagNames.map(async (tagName) => {
      let tag = await this.prisma.tags.findUnique({ where: { name: tagName } });
      if (!tag) {
        tag = await this.prisma.tags.create({
          data: { name: tagName, display_name: tagName, is_active: true, is_default: false },
        });
      }
      return tag;
    });

    const tags = await Promise.all(tagPromises);
    const tagIds = tags.map((tag) => tag.id);

    await this.prisma.single_tags.deleteMany({ where: { single_id: productId } });

    if (tagIds.length > 0) {
      await this.prisma.single_tags.createMany({
        data: tagIds.map((tagId) => ({ single_id: productId, tag_id: tagId })),
      });
    }

    const updatedProduct = await this.prisma.singles.findUnique({
      where: { id: productId },
      include: { tags: { include: { tags: true } } },
    });

    await this.invalidateAndNotify();

    return {
      ...updatedProduct,
      tags: updatedProduct?.tags.map((st) => st.tags) || [],
    };
  }

  async updateFoil(productId: string, foil: boolean, user: UserWithRole) {
    const product = await this.prisma.singles.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);

    if (user.role.name !== 'ADMIN' && product.owner_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update foil status for this product',
      );
    }

    const updatedProduct = await this.prisma.singles.update({
      where: { id: productId },
      data: { foil },
      include: { tags: { include: { tags: true } } },
    });

    await this.invalidateAndNotify();

    return {
      ...updatedProduct,
      tags: updatedProduct.tags.map((st) => st.tags),
    };
  }

  async update(id: string, updateDto: UpdateSingleDto, user: UserWithRole) {
    // Guard: only forward valid UUIDs to Prisma — stale localStorage entries
    // can contain importation composite IDs (e.g. "98097-Inglés-7") that cause
    // a P2007 invalid input syntax error on the UUID column.
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const { tags, finalPrice, cardName, ...rest } = updateDto;
    const existing = await this.prisma.singles.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID ${id} not found`);

    if (user.role.name !== 'ADMIN' && existing.owner_id !== user.id) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    const dataToUpdate: any = { ...rest };
    if (cardName) {
      dataToUpdate.cardName = cardName;
      dataToUpdate.name = cardName;
    }

    if (finalPrice !== undefined && user.role.name === 'ADMIN') {
      dataToUpdate.price = finalPrice;
    }

    await this.prisma.singles.update({ where: { id }, data: dataToUpdate });

    if (tags) {
      const result = await this.updateTags(id, tags, user);
      await this.invalidateAndNotify();
      return result;
    }

    const result = await this.findOne(id);
    await this.invalidateAndNotify();
    return result;
  }

  async findByIds(ids: string[]) {
    if (!ids?.length) return [];
    // Guard: only forward valid UUIDs to Prisma — stale localStorage entries
    // can contain importation composite IDs (e.g. "98097-Inglés-7") that cause
    // a P2007 invalid input syntax error on the UUID column.
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = ids.filter((id) => UUID_REGEX.test(id));
    if (!validIds.length) return [];
    const products = await this.prisma.singles.findMany({
      where: { id: { in: validIds } },
      include: { conditions: true, languages: true, tcgs: true, categories: true },
    });

    // Fresh pricing for items linked to importation to ensure wishlist accuracy
    const freshDataMap = new Map<
      string,
      {
        price: number;
        priceString: string;
        basePriceJPY?: number;
        isLocal: boolean;
        importFeeMXN?: number;
        basePriceMXN?: number;
      }
    >();
    const importationLinked = products.filter((p) => p.importationId);

    if (importationLinked.length > 0) {
      try {
        const freshPrices = await this.importationService.getBatchPrices(
          importationLinked.map((p) => ({
            importationId: p.importationId!,
            name: p.cardName || '',
          })),
        );

        if (freshPrices && Array.isArray(freshPrices)) {
          for (const fp of freshPrices) {
            freshDataMap.set(fp.importationId, {
              price: fp.price, // Total with fees
              priceString: fp.priceString, // Formatted as "$... MXN" (Base Price)
              basePriceJPY: fp.basePriceJPY,
              isLocal: !!fp.isLocalInventory,
              importFeeMXN: fp.importFeeMXN,
              basePriceMXN: fp.basePriceMXN,
            });
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch fresh prices for batch: ${error.message}`);
      }
    }

    return products.map((product) => {
      const fresh = product.importationId ? freshDataMap.get(product.importationId) : null;
      const finalPrice = fresh ? fresh.price : Number(product.price || 0);
      const displayPrice = fresh ? fresh.priceString : `$${finalPrice.toFixed(2)} MXN`;
      const isLocal = fresh ? fresh.isLocal : !!product.isLocalInventory;

      return {
        ...product,
        condition_name: product.conditions?.name,
        language_name: product.languages?.name,
        tcg_name: product.tcgs?.name,
        category_name: product.categories?.name,
        category: product.categories?.name || 'SINGLES',
        tcg:
          product.tcgs?.name ||
          (product.tcg_id === 'bd789d3f-5569-4971-890e-e261e145e42c' ? 'MAGIC' : 'OTHER'),
        tcgId: product.tcg_id,
        price: displayPrice,
        price_mxn: finalPrice,
        basePriceJPY: fresh?.basePriceJPY,
        basePriceMXN: fresh?.basePriceMXN,
        importFeeMXN: fresh?.importFeeMXN,
        isLocalInventory: isLocal,
        immediateDelivery: isLocal,
      };
    });
  }

  async findAlternativeVersions(id: string, limit: number = 10) {
    const current = await this.prisma.singles.findUnique({
      where: { id },
      select: { cardName: true },
    });
    if (!current?.cardName) throw new NotFoundException(`Product with ID ${id} not found`);

    const alternatives = await this.prisma.singles.findMany({
      where: {
        cardName: { equals: current.cardName, mode: 'insensitive' },
        stock: { gt: 0 },
        id: { not: id },
      },
      include: { conditions: true, languages: true },
      orderBy: { price: 'asc' },
      take: limit,
    });

    return alternatives.map((alt) => ({
      id: alt.id,
      cardName: alt.cardName,
      name: alt.cardName,
      expansion: alt.expansion,
      condition: alt.conditions?.name ?? null,
      language: alt.languages?.display_name ?? alt.languages?.name ?? null,
      foil: alt.foil,
      surgeFoil: alt.surgeFoil,
      price: Number(alt.price),
      stock: alt.stock,
      imageUrl: alt.img,
      importationId: alt.importationId,
      isLocalInventory: alt.isLocalInventory,
      variant: alt.expansion ?? null,
    }));
  }

  async removeBulk(ids: string[], user: UserWithRole) {
    if (!ids?.length) return { count: 0 };
    const whereClause =
      user.role?.name === 'ADMIN' ? { id: { in: ids } } : { id: { in: ids }, owner_id: user.id };

    return this.prisma.$transaction(async (tx) => {
      await tx.single_tags.deleteMany({ where: { single_id: { in: ids } } });
      await tx.cart_items.updateMany({
        where: { single_id: { in: ids } },
        data: { single_id: null },
      });
      await tx.listings.deleteMany({ where: { single_id: { in: ids } } });
      await tx.order_items.deleteMany({ where: { single_id: { in: ids } } });
      return tx.singles.deleteMany({ where: whereClause });
    });
  }
}
