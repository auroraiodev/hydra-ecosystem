import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { NotificationsService, NotificationType } from '../notifications/notifications.service.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';
import { UserWithRole } from '../users/interfaces/user.interface.js';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(createListingDto: CreateListingDto, user: UserWithRole) {
    // Verify user has permission (SELLER or ADMIN)
    if (user.role.name !== 'SELLER' && user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only sellers and admins can create listings');
    }

    // Verify product exists
    const product = await (this.prisma as any).singles.findUnique({
      where: { id: createListingDto.single_id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      const listing = await (this.prisma as any).listings.create({
        data: {
          user_id: user.id,
          single_id: createListingDto.single_id,
          status: createListingDto.status || 'ACTIVE',
        },
        include: {
          singles: true,
          users: {
            include: {
              roles: true,
            },
          },
        },
      });

      // Remove password from user if present
      const { password: _, ...userWithoutPassword } = listing.users;
      return {
        ...listing,
        users: userWithoutPassword,
      };
    } catch {
      throw new BadRequestException('Failed to create listing');
    }
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      (this.prisma as any).listings.findMany({
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          singles: {
            include: {
              categories: true,
              conditions: true,
              languages: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
              username: true,
              first_name: true,
              last_name: true,
              is_active: true,
              roles: true,
            },
          },
        },
      }),
      (this.prisma as any).listings.count(),
    ]);

    return {
      data: listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const listing = await (this.prisma as any).listings.findUnique({
      where: { id },
      include: {
        singles: {
          include: {
            categories: true,
            conditions: true,
            languages: true,
          },
        },
        users: {
          include: {
            roles: true,
          },
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            is_active: true,
            roles: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async update(id: string, updateListingDto: UpdateListingDto, user: UserWithRole) {
    // Verify user has permission (SELLER or ADMIN)
    if (user.role.name !== 'SELLER' && user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only sellers and admins can update listings');
    }

    // Check if listing exists
    const listing = await (this.prisma as any).listings.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    // Both SELLER and ADMIN can update any listing's status
    try {
      const updatedListing = await (this.prisma as any).listings.update({
        where: { id },
        data: {
          ...(updateListingDto.status && { status: updateListingDto.status }),
        },
        include: {
          singles: {
            include: {
              categories: true,
              conditions: true,
              languages: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
              username: true,
              first_name: true,
              last_name: true,
              is_active: true,
              roles: true,
            },
          },
        },
      });

      // Notify the listing owner if status changed
      if (updateListingDto.status && updateListingDto.status !== listing.status) {
        const statusLabels: Record<string, string> = {
          ACTIVE: 'activo',
          SOLD: 'vendido',
          DISABLED: 'retirada',
          IN_TRANSIT: 'en camino a México',
          IN_MEXICO: 'en México (procesando importación)',
        };
        const label = statusLabels[updateListingDto.status] ?? updateListingDto.status;
        await this.notifications.createNotification({
          userId: listing.user_id,
          type: NotificationType.LISTING_STATUS,
          title: 'Estado de tu artículo actualizado',
          message: `Tu artículo ha sido marcado como ${label}.`,
          data: { listingId: id, newStatus: updateListingDto.status },
        });
      }

      return updatedListing;
    } catch {
      throw new BadRequestException('Failed to update listing');
    }
  }

  async remove(id: string, user: UserWithRole) {
    // Verify user has permission (SELLER or ADMIN)
    if (user.role.name !== 'SELLER' && user.role.name !== 'ADMIN') {
      throw new ForbiddenException('Only sellers and admins can delete listings');
    }

    // Check if listing exists
    const listing = await (this.prisma as any).listings.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    // Soft-delete: mark as DISABLED so it shows as "RETIRADA" in the seller's history
    try {
      await (this.prisma as any).listings.update({
        where: { id },
        data: { status: 'DISABLED' },
      });

      return { message: `Listing with ID ${id} has been withdrawn successfully` };
    } catch {
      throw new BadRequestException('Failed to withdraw listing');
    }
  }

  async findByUser(userId: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    // Fetch commission rate from settings (default to 12% as per user request)
    const commissionSetting = await (this.prisma as any).admin_settings.findUnique({
      where: { key: 'SELLER_COMMISSION' },
    });
    const commissionPercent = commissionSetting ? parseFloat(commissionSetting.value) : 12;
    const earningsMultiplier = 1 - commissionPercent / 100;

    // We query from the 'singles' table because we want to show everything the user OWNS or IS SELLING.
    const [singles, total] = await Promise.all([
      (this.prisma as any).singles.findMany({
        where: {
          OR: [{ owner_id: userId }, { listings: { some: { user_id: userId } } }],
        },
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          categories: true,
          conditions: true,
          languages: true,
          listings: true, // Get all listings directly linked to this single
        },
      }),
      (this.prisma as any).singles.count({
        where: {
          OR: [{ owner_id: userId }, { listings: { some: { user_id: userId } } }],
        },
      }),
    ]);

    // Optimize: If we have singles with importationId but no listings,
    // we should try to find matching global listings to show correct status.
    const results = await Promise.all(
      singles.map(async (single) => {
        // 1. Direct listing (priority: mine > active > any)
        let listing =
          single.listings.find((l) => l.user_id === userId) ||
          single.listings.find((l) => l.status === 'ACTIVE') ||
          single.listings[0];

        // 2. Fallback for global products: If no direct listing, look for any active-like listing with same importation attributes
        if (!listing) {
          const matchingCriteria: any = {
            language_id: single.language_id,
            foil: single.foil,
          };

          if (single.importationId) {
            matchingCriteria.importationId = single.importationId;
          } else if (single.cardName && single.expansion) {
            matchingCriteria.cardName = single.cardName;
            matchingCriteria.expansion = single.expansion;
          }

          const globalListing = await (this.prisma as any).listings.findFirst({
            where: {
              status: { in: ['ACTIVE', 'IN_TRANSIT', 'IN_MEXICO'] as any },
              singles: matchingCriteria,
            },
            include: { singles: true },
          });

          if (globalListing) {
            listing = globalListing;
          }
        }

        const discount = single.conditions?.discount || 0;
        const basePrice = Number(single.price || 0);
        const discountedPrice = basePrice * (1 - discount / 100);

        return {
          id: listing?.id || `virtual-${single.id}`,
          user_id: userId,
          status: listing?.status || (single.stock > 0 ? 'ACTIVE' : 'UNLISTED'),
          single_id: single.id,
          singles: {
            ...single,
            price: single.price.toString(),
            stock: single.stock,
          },
          earnings: discountedPrice * earningsMultiplier,
          commission_rate: commissionPercent,
        };
      }),
    );

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
