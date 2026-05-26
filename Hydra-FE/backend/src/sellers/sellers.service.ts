import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService } from '../common/cache/cache.service.js';
import * as PrismaClientPkg from '@prisma/client';
const order_status_enum = (PrismaClientPkg as any).order_status_enum;
type order_status_enum = any;
import { WalletService } from '../wallet/wallet.service.js';

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
    private walletService: WalletService,
  ) {}

  async getDashboardStats(sellerId: string) {
    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      ordersToday,
      revenueToday,
      recentOrders,
      lowStockAlerts,
    ] = await Promise.all([
      this.getTotalProducts(sellerId),
      this.getTotalOrders(sellerId),
      this.getTotalRevenue(sellerId),
      this.getOrdersToday(sellerId),
      this.getRevenueToday(sellerId),
      this.getRecentOrders(sellerId),
      this.getLowStockAlerts(sellerId),
    ]);

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      ordersToday,
      revenueToday,
      recentOrders,
      lowStockAlerts,
    };
  }

  async getTotalProducts(sellerId: string): Promise<number> {
    return (this.prismaService as any).singles.count({
      where: { owner_id: sellerId, stock: { gt: 0 } },
    });
  }

  async getTotalOrders(sellerId: string): Promise<number> {
    return (this.prismaService as any).orders.count({
      where: {
        items: {
          some: {
            singles: {
              owner_id: sellerId,
            },
          },
        },
      },
    });
  }

  async getTotalRevenue(sellerId: string): Promise<number> {
    const result = await this.prismaService.$queryRaw<[{ revenue: string }]>`
      SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0)::text AS revenue
      FROM order_items oi
      JOIN singles s ON s.id = oi.single_id
      JOIN orders o ON o.id = oi.order_id
      WHERE s.owner_id = ${sellerId}
        AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
    `;
    return Number(result[0]?.revenue || 0);
  }

  async getOrdersToday(sellerId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (this.prismaService as any).orders.count({
      where: {
        created_at: { gte: today },
        items: {
          some: {
            singles: {
              owner_id: sellerId,
            },
          },
        },
      },
    });
  }

  async getRevenueToday(sellerId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prismaService.$queryRaw<[{ revenue: string }]>`
      SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0)::text AS revenue
      FROM order_items oi
      JOIN singles s ON s.id = oi.single_id
      JOIN orders o ON o.id = oi.order_id
      WHERE s.owner_id = ${sellerId}
        AND o.created_at >= ${today}
        AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
    `;
    return Number(result[0]?.revenue || 0);
  }

  async getRecentOrders(sellerId: string, limit: number = 10) {
    const recentOrders = await (this.prismaService as any).orders.findMany({
      where: {
        items: {
          some: {
            singles: {
              owner_id: sellerId,
            },
          },
        },
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          where: {
            singles: {
              owner_id: sellerId,
            },
          },
          select: {
            unit_price: true,
            quantity: true,
          },
        },
      },
    });

    return recentOrders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0),
      createdAt: order.created_at,
    }));
  }

  async getLowStockAlerts(sellerId: string, threshold: number = 5) {
    return (this.prismaService as any).singles.findMany({
      where: {
        owner_id: sellerId,
        stock: { lte: threshold },
        isLocalInventory: true,
      },
      select: {
        id: true,
        cardName: true,
        stock: true,
      },
      orderBy: { stock: 'asc' },
    });
  }

  async getRevenueByPeriod(sellerId: string, days: number = 180) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueData = await this.prismaService.$queryRaw<
      Array<{ period: Date; orders: bigint; revenue: string }>
    >`
      SELECT
        DATE_TRUNC('month', o.created_at) AS period,
        COUNT(DISTINCT o.id) AS orders,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0)::text AS revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN singles s ON s.id = oi.single_id
      WHERE s.owner_id = ${sellerId}
        AND o.created_at >= ${startDate}
        AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY period ASC
    `;

    return revenueData.map((item) => ({
      period: `${item.period.getUTCFullYear()}-${String(item.period.getUTCMonth() + 1).padStart(2, '0')}`,
      revenue: Number(item.revenue),
      orders: Number(item.orders),
    }));
  }

  async getOrderStats(sellerId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      created_at: { gte: startDate },
      items: {
        some: {
          singles: {
            owner_id: sellerId,
          },
        },
      },
    };

    const [
      totalOrders,
      pendingOrders,
      paidOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      (this.prismaService as any).orders.count({ where }),
      (this.prismaService as any).orders.count({
        where: { ...where, status: order_status_enum.PENDING },
      }),
      (this.prismaService as any).orders.count({
        where: { ...where, status: order_status_enum.PAID },
      }),
      (this.prismaService as any).orders.count({
        where: { ...where, status: order_status_enum.PROCESSING },
      }),
      (this.prismaService as any).orders.count({
        where: { ...where, status: order_status_enum.SHIPPED },
      }),
      (this.prismaService as any).orders.count({
        where: { ...where, status: order_status_enum.COMPLETED },
      }),
      (this.prismaService as any).orders.count({
        where: { ...where, status: order_status_enum.CANCELLED },
      }),
      this.getTotalRevenue(sellerId), // Reusing existing method for simplicity
    ]);

    return {
      totalOrders,
      pendingOrders,
      paidOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: revenueResult,
      averageOrderValue: completedOrders > 0 ? revenueResult / completedOrders : 0,
    };
  }

  async getOrders(sellerId: string, page: number = 1, limit: number = 20, filter: any = {}, sortBy?: string, sortDir: 'asc' | 'desc' = 'desc') {
    const where: any = {
      items: {
        some: {
          singles: {
            owner_id: sellerId,
          },
        },
      },
    };

    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { id: { contains: filter.search } },
        { users: { email: { contains: filter.search } } },
        { users: { first_name: { contains: filter.search } } },
        { users: { last_name: { contains: filter.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      (this.prismaService as any).orders.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              avatar_url: true,
            },
          },
          items: {
            where: {
              singles: {
                owner_id: sellerId,
              },
            },
            include: {
              singles: {
                select: {
                  id: true,
                  cardName: true,
                  img: true,
                  price: true,
                  owner_id: true,
                },
              },
            },
          },
        },
        orderBy: (() => {
          const cols: Record<string, any> = {
            date: { created_at: sortDir },
            total: { total_amount: sortDir },
            status: { status: sortDir },
          };
          return cols[sortBy ?? ''] ?? { created_at: 'desc' };
        })(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prismaService as any).orders.count({ where }),
    ]);

    // Calculate seller-specific total for each order
    const sellerOrders = orders.map((order) => {
      const sellerTotal = order.items.reduce(
        (sum, item) => sum + Number(item.unit_price) * item.quantity,
        0,
      );
      return {
        ...order,
        total_amount: sellerTotal,
        total: sellerTotal,
      };
    });

    return {
      data: sellerOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(sellerId: string, orderId: string) {
    const order = await (this.prismaService as any).orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            phone: true,
          },
        },
        items: {
          where: {
            singles: {
              owner_id: sellerId,
            },
          },
          include: {
            singles: {
              select: {
                id: true,
                cardName: true,
                img: true,
                price: true,
                owner_id: true,
              },
            },
          },
        },
        shipping: {
          include: {
            shipping_methods: true,
          },
        },
        payments: true,
      },
    });

    if (!order) return null;

    // Verify the order actually contains seller's items
    if (order.items.length === 0) return null;

    const sellerTotal = order.items.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0,
    );

    return {
      ...order,
      total_amount: sellerTotal,
      total: sellerTotal,
    };
  }

  async getWallet(sellerId: string) {
    return this.walletService.getWalletData(sellerId);
  }

  async getPendingPayouts(sellerId: string) {
    const orders = await (this.prismaService as any).orders.findMany({
      where: {
        status: {
          in: [order_status_enum.PAID, order_status_enum.PROCESSING, order_status_enum.SHIPPED],
        },
        items: { some: { singles: { owner_id: sellerId } } },
      },
      include: {
        items: {
          where: { singles: { owner_id: sellerId } },
          include: {
            singles: { select: { cardName: true, img: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders.map((order) => {
      const subtotal = order.items.reduce(
        (sum: number, item) => sum + Number(item.unit_price) * item.quantity,
        0,
      );
      return {
        orderId: order.id,
        orderStatus: order.status,
        createdAt: order.created_at,
        subtotal,
        itemCount: order.items.reduce((s: number, i) => s + i.quantity, 0),
        items: order.items.map((i) => ({
          name: i.singles.cardName,
          imageUrl: i.singles.images?.[0] ?? i.singles.img ?? null,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
        })),
      };
    });
  }

  async requestWithdrawal(sellerId: string, amount: number, details: string) {
    return this.walletService.requestWithdrawal(sellerId, amount, details);
  }

  async requestOrderPayout(sellerId: string, orderIds: string[], details: string) {
    const orders = await (this.prismaService as any).orders.findMany({
      where: {
        id: { in: orderIds },
        status: {
          in: [order_status_enum.PAID, order_status_enum.PROCESSING, order_status_enum.SHIPPED],
        },
        items: { some: { singles: { owner_id: sellerId } } },
      },
      include: {
        items: {
          where: { singles: { owner_id: sellerId } },
          include: { singles: { select: { cardName: true } } },
        },
      },
    });

    if (orders.length === 0) {
      throw new BadRequestException('No se encontraron órdenes válidas para el cobro.');
    }

    const totalAmount = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + Number(item.unit_price) * item.quantity, 0),
      0,
    );

    const orderSummary = orders
      .map((o) => {
        const itemNames = o.items.map((i) => i.singles.cardName).join(', ');
        return `#${o.id.slice(0, 8).toUpperCase()} (${itemNames})`;
      })
      .join(' | ');

    const description = `Solicitud de cobro por órdenes: ${orderSummary}. Datos: ${details}`;

    return this.walletService.requestOrderPayout(
      sellerId,
      totalAmount,
      orders.map((o) => o.id),
      description,
    );
  }
}
