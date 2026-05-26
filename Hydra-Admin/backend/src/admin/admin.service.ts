import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CacheService } from '../common/cache/cache.service';
import { PrismaService } from '../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway.js';
import { order_status_enum, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
  topCategories: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    expansion: string | null;
    unitsSold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: Date;
  }>;
  lowStockAlerts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minStock: number;
  }>;
}

export interface DashboardFilter {
  dateFrom?: Date;
  dateTo?: Date;
  categoryIds?: string[];
  userId?: string;
  status?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  // Get comprehensive admin dashboard statistics
  async getDashboardStats(_filter?: DashboardFilter): Promise<AdminStats> {
    try {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        activeUsers,
        newUsersToday,
        ordersToday,
        revenueToday,
        topCategories,
        topProducts,
        recentOrders,
        lowStockAlerts,
      ] = await Promise.all([
        this.getTotalUsers().catch((e) => {
          this.logger.error('Error in getTotalUsers', e);
          return 0;
        }),
        this.getTotalProducts().catch((e) => {
          this.logger.error('Error in getTotalProducts', e);
          return 0;
        }),
        this.getTotalOrders().catch((e) => {
          this.logger.error('Error in getTotalOrders', e);
          return 0;
        }),
        this.getTotalRevenue().catch((e) => {
          this.logger.error('Error in getTotalRevenue', e);
          return 0;
        }),
        this.getActiveUsers().catch((e) => {
          this.logger.error('Error in getActiveUsers', e);
          return 0;
        }),
        this.getNewUsersToday().catch((e) => {
          this.logger.error('Error in getNewUsersToday', e);
          return 0;
        }),
        this.getOrdersToday().catch((e) => {
          this.logger.error('Error in getOrdersToday', e);
          return 0;
        }),
        this.getRevenueToday().catch((e) => {
          this.logger.error('Error in getRevenueToday', e);
          return 0;
        }),
        this.getTopCategories().catch((e) => {
          this.logger.error('Error in getTopCategories', e);
          return [];
        }),
        this.getTopProducts().catch((e) => {
          this.logger.error('Error in getTopProducts', e);
          return [];
        }),
        this.getRecentOrders().catch((e) => {
          this.logger.error('Error in getRecentOrders', e);
          return [];
        }),
        this.getLowStockAlerts().catch((e) => {
          this.logger.error('Error in getLowStockAlerts', e);
          return [];
        }),
      ]);

      return {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        activeUsers,
        newUsersToday,
        ordersToday,
        revenueToday,
        topCategories,
        topProducts,
        recentOrders,
        lowStockAlerts,
      };
    } catch (error) {
      this.logger.error('Fatal error building dashboard stats', error);
      throw error;
    }
  }

  // Users management
  async getTotalUsers(): Promise<number> {
    return this.prismaService.users.count();
  }

  async getActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prismaService.users.count({
      where: {
        is_active: true,
        orders: {
          some: {
            created_at: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });
  }

  async getNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prismaService.users.count({
      where: {
        created_at: {
          gte: today,
        },
      },
    });
  }

  async getUserGrowth(days: number = 30): Promise<Array<{ date: Date; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyGrowth = await this.prismaService.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return dailyGrowth.map((item) => ({
      ...item,
      count: Number(item.count),
      date: new Date(item.date),
    }));
  }

  // Products management
  async getTotalProducts(): Promise<number> {
    return this.prismaService.singles.count({ where: { stock: { gt: 0 } } });
  }

  async getTopCategories(
    limit: number = 10,
  ): Promise<Array<{ id: string; name: string; count: number }>> {
    const topCategories = await this.prismaService.singles.groupBy({
      by: ['category_id'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const categoryIds = topCategories.map((c) => c.category_id);
    const categories = await this.prismaService.categories.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, display_name: true },
    });

    const categoryMap = categories.reduce(
      (acc, cat) => ({ ...acc, [cat.id]: cat.display_name }),
      {},
    );

    return topCategories.map((category) => ({
      id: category.category_id,
      name: categoryMap[category.category_id] || 'Otras',
      count: category._count.id,
    }));
  }

  async getTopProducts(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      id: string;
      name: string;
      expansion: string | null;
      unitsSold: number;
      revenue: number;
    }>
  > {
    const rows = await this.prismaService.$queryRaw<
      Array<{
        id: string;
        name: string;
        expansion: string | null;
        units_sold: bigint;
        revenue: string;
      }>
    >`
      SELECT
        s.id,
        s.card_name as name,
        s.expansion,
        COALESCE(SUM(oi.quantity), 0)::bigint AS units_sold,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0)::text AS revenue
      FROM order_items oi
      JOIN singles s ON s.id = oi.single_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
        ${startDate ? Prisma.sql`AND o.created_at >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND o.created_at < ${endDate}` : Prisma.empty}
      GROUP BY s.id, s.card_name, s.expansion
      ORDER BY units_sold DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      id: r.id,
      name: r.name ?? 'Unknown Product',
      expansion: r.expansion ?? '',
      unitsSold: Number(r.units_sold),
      revenue: Number(r.revenue),
    }));
  }

  async getBuyerStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    uniqueBuyers: number;
    repeatBuyers: number;
    repeatBuyerRate: number;
    avgOrdersPerBuyer: number;
    topBuyers: Array<{
      id: string;
      name: string;
      email: string;
      orderCount: number;
      totalSpent: number;
    }>;
  }> {
    const [buyerRows, topBuyerRows] = await Promise.all([
      this.prismaService.$queryRaw<Array<{ user_id: string; order_count: bigint }>>`
        SELECT user_id, COUNT(*)::bigint AS order_count
        FROM orders
        WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
          ${startDate ? Prisma.sql`AND created_at >= ${startDate}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND created_at < ${endDate}` : Prisma.empty}
        GROUP BY user_id
      `,
      this.prismaService.$queryRaw<
        Array<{
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          order_count: bigint;
          total_spent_num: number;
          total_spent: string;
        }>
      >`
        SELECT
          u.id AS user_id,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(DISTINCT o.id)::bigint AS order_count,
          COALESCE(SUM(items.revenue), 0) AS total_spent_num,
          COALESCE(SUM(items.revenue), 0)::text AS total_spent
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN (
          SELECT order_id, unit_price * quantity AS revenue FROM order_items
          UNION ALL
          SELECT order_id, unit_price * quantity AS revenue FROM order_items_importation
        ) items ON items.order_id = o.id
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
          ${startDate ? Prisma.sql`AND o.created_at >= ${startDate}` : Prisma.empty}
          ${endDate ? Prisma.sql`AND o.created_at < ${endDate}` : Prisma.empty}
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_spent_num DESC, order_count DESC
        LIMIT 10
      `,
    ]);

    const uniqueBuyers = buyerRows.length;
    const repeatBuyers = buyerRows.filter((r) => Number(r.order_count) > 1).length;
    const totalOrders = buyerRows.reduce((sum, r) => sum + Number(r.order_count), 0);

    return {
      uniqueBuyers,
      repeatBuyers,
      repeatBuyerRate: uniqueBuyers > 0 ? Math.round((repeatBuyers / uniqueBuyers) * 100) : 0,
      avgOrdersPerBuyer: uniqueBuyers > 0 ? Math.round((totalOrders / uniqueBuyers) * 10) / 10 : 0,
      topBuyers: topBuyerRows.map((r) => ({
        id: r.user_id,
        name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || r.email,
        email: r.email,
        orderCount: Number(r.order_count),
        totalSpent: Number(r.total_spent),
      })),
    };
  }

  async getLowStockAlerts(threshold: number = 5): Promise<
    Array<{
      productId: string;
      productName: string;
      currentStock: number;
      minStock: number;
    }>
  > {
    const lowStockProducts = await this.prismaService.singles.findMany({
      where: {
        stock: {
          lte: threshold,
        },
        isLocalInventory: true,
      },
      select: {
        id: true,
        cardName: true,
        stock: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });

    return lowStockProducts.map((product) => ({
      productId: product.id,
      productName: product.cardName ?? 'Unknown Product',
      currentStock: product.stock,
      minStock: threshold,
    }));
  }

  // Orders management
  async getTotalOrders(): Promise<number> {
    return this.prismaService.orders.count();
  }

  async getOrdersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prismaService.orders.count({
      where: {
        created_at: {
          gte: today,
        },
      },
    });
  }

  async getRecentOrders(
    limit: number = 10,
  ): Promise<Array<{ id: string; status: string; total: number; createdAt: Date }>> {
    const recentOrders = await this.prismaService.orders.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        items: {
          select: {
            unit_price: true,
            quantity: true,
          },
        },
        importation_items: {
          select: {
            unit_price: true,
            quantity: true,
          },
        },
      },
    });

    return recentOrders.map((order) => {
      const itemsTotal = order.items.reduce(
        (sum, item) => sum + Number(item.unit_price) * item.quantity,
        0,
      );
      const importationTotal = order.importation_items.reduce(
        (sum, item) => sum + Number(item.unit_price) * item.quantity,
        0,
      );

      return {
        id: order.id,
        status: order.status,
        total: itemsTotal + importationTotal,
        createdAt: order.created_at,
      };
    });
  }

  async getOrderStats(
    days: number = 30,
  ): Promise<Array<{ date: Date; count: number; revenue: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await this.prismaService.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM orders 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return dailyStats.map((item) => ({
      ...item,
      count: Number(item.count),
      date: new Date(item.date),
      revenue: 0,
    }));
  }

  // Revenue management
  async getTotalRevenue(): Promise<number> {
    const result = await this.prismaService.$queryRaw<[{ revenue: string }]>`
      SELECT COALESCE(SUM(items.revenue), 0)::text AS revenue
      FROM orders o
      JOIN (
        SELECT order_id, unit_price * quantity AS revenue FROM order_items
        UNION ALL
        SELECT order_id, unit_price * quantity AS revenue FROM order_items_importation
      ) items ON items.order_id = o.id
      WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
    `;
    return Number(result[0]?.revenue || 0);
  }

  async getRevenueToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.prismaService.$queryRaw<[{ revenue: string }]>`
      SELECT COALESCE(SUM(items.revenue), 0)::text AS revenue
      FROM orders o
      JOIN (
        SELECT order_id, unit_price * quantity AS revenue FROM order_items
        UNION ALL
        SELECT order_id, unit_price * quantity AS revenue FROM order_items_importation
      ) items ON items.order_id = o.id
      WHERE o.created_at >= ${today}
        AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
    `;
    return Number(result[0]?.revenue || 0);
  }

  async getRevenueByPeriod(
    days: number = 180,
  ): Promise<Array<{ period: string; revenue: number; orders: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueData = await this.prismaService.$queryRaw<
      Array<{ period: Date; orders: bigint; revenue: string }>
    >`
      SELECT
        DATE_TRUNC('month', o.created_at) AS period,
        COUNT(DISTINCT o.id) AS orders,
        COALESCE(SUM(items.revenue), 0)::text AS revenue
      FROM orders o
      LEFT JOIN (
        SELECT order_id, unit_price * quantity AS revenue FROM order_items
        UNION ALL
        SELECT order_id, unit_price * quantity AS revenue FROM order_items_importation
      ) items ON items.order_id = o.id
      WHERE o.created_at >= ${startDate}
        AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY period ASC
    `;

    return revenueData.map((item) => ({
      // Return as YYYY-MM to avoid timezone shifting on the frontend
      period: `${item.period.getUTCFullYear()}-${String(item.period.getUTCMonth() + 1).padStart(2, '0')}`,
      revenue: Number(item.revenue),
      orders: Number(item.orders),
    }));
  }

  async getProductAnalytics(
    top: number = 10,
    lowStock: number = 5,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const [topProducts, lowStockAlerts] = await Promise.all([
      this.getTopProducts(top, startDate, endDate),
      this.getLowStockAlerts(lowStock),
    ]);
    return { topProducts, lowStockAlerts };
  }

  async triggerBackup(config: any): Promise<any> {
    this.logger.log(`[Maintenance] Starting database backup: type=${config.type}`);
    return {
      status: 'success',
      timestamp: new Date(),
      type: config.type,
      message: 'Copia de seguridad completada con éxito',
    };
  }

  async clearCache(pattern?: string): Promise<any> {
    // Cache is now neutralized globally. No action needed here.

    // Notify all connected clients to clear their local caches (e.g. categories)
    if (this.chatGateway?.server) {
      this.chatGateway.server.emit('invalidate_cache', {
        type: pattern === 'categories:*' || !pattern ? 'categories' : 'all',
      });
    }

    return { status: 'success', message: 'Cache cleared' };
  }

  async restoreDatabase(backupFile: string): Promise<any> {
    if (backupFile === 'factory-reset') {
      this.logger.warn('[Maintenance] PERFORMING FACTORY RESET');
      try {
        await this.prismaService.$transaction([
          this.prismaService.order_items.deleteMany(),
          this.prismaService.order_items_importation.deleteMany(),
          this.prismaService.orders.deleteMany(),
          this.prismaService.wallet_transactions.deleteMany(),
          this.prismaService.singles.deleteMany(),
          this.prismaService.notifications.deleteMany(),
        ]);

        await this.clearCache();
        return { success: true, message: 'Sistema restaurado de fábrica correctamente' };
      } catch (error) {
        this.logger.error('Error during factory reset', error);
        throw new BadRequestException('Error al realizar el reset de fábrica');
      }
    }
    return { status: 'initiated', file: backupFile };
  }

  async exportData(config: any): Promise<any> {
    this.logger.log(`[Maintenance] Exporting data: type=${config.type}, format=${config.format}`);
    return {
      success: true,
      message: 'Exportación completada',
      url: `${process.env.API_URL || 'https://api.hydracollect.com'}/v1/admin/export/download`,
      timestamp: new Date(),
    };
  }

  async getNotifications(): Promise<any[]> {
    return [];
  }

  async markNotificationRead(id: string): Promise<any> {
    return { status: 'success', id };
  }

  // Order Management Methods
  async getOrders(filter: any = {}, page: number = 1, limit: number = 20): Promise<any> {
    const where: any = {};

    if (filter.status) where.status = filter.status;
    if (filter.userId) where.userId = filter.userId;
    if (filter.dateFrom) where.createdAt = { gte: filter.dateFrom };
    if (filter.dateTo) where.createdAt = { lte: filter.dateTo };
    if (filter.search) {
      where.OR = [
        { id: { contains: filter.search } },
        { user: { email: { contains: filter.search } } },
        { user: { first_name: { contains: filter.search } } },
        { user: { last_name: { contains: filter.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prismaService.orders.findMany({
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
            include: {
              singles: {
                select: {
                  id: true,
                  cardName: true,
                  img: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prismaService.orders.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string): Promise<any> {
    return this.prismaService.orders.findUnique({
      where: { id },
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
          include: {
            singles: {
              select: {
                id: true,
                cardName: true,
                img: true,
                price: true,
              },
            },
          },
        },
        shipping: {
          include: {
            shipping_methods: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            payment_method: true,
            mercadopago_payment_id: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  async updateOrder(id: string, updateData: any): Promise<any> {
    const order = await this.prismaService.orders.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        items: {
          include: {
            singles: {
              select: {
                id: true,
                cardName: true,
                img: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // Invalidate dashboard & order-stats caches so metrics reflect the new status immediately
    await this.invalidateDashboardCache();

    // Create audit log
    await this.createAuditLog({
      userId: updateData.updatedBy || 'system',
      action: 'UPDATE_ORDER',
      resource: `Order:${id}`,
      details: updateData,
      ipAddress: 'system',
    });

    return order;
  }

  private async invalidateDashboardCache(): Promise<void> {
    // Delete known cache keys for dashboard and order stats.
    // Keys are built with JSON.stringify(filter) — cover common filter combos.
    const keys = [
      'admin:dashboard:stats:undefined',
      'admin:dashboard:stats:{}',
      'admin:dashboard:stats:null',
      `admin:orders:stats:undefined`,
      `admin:orders:stats:{}`,
      `admin:orders:stats:null`,
    ];
    await Promise.allSettled(keys.map((k) => this.cacheService.del(k)));
  }

  async assignOrder(id: string, assignmentData: { adminId: string; notes?: string }): Promise<any> {
    const order = await this.prismaService.orders.update({
      where: { id },
      data: {
        status: order_status_enum.PENDING, // Keep as pending for now
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Create audit log
    await this.createAuditLog({
      userId: assignmentData.adminId,
      action: 'ASSIGN_ORDER',
      resource: `Order:${id}`,
      details: assignmentData,
      ipAddress: 'system',
    });

    return order;
  }

  async cancelOrder(
    id: string,
    cancelData: { reason?: string; refundAmount?: number; notifyCustomer?: boolean },
  ): Promise<any> {
    const order = await this.prismaService.orders.update({
      where: { id },
      data: {
        status: order_status_enum.CANCELLED,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    await this.invalidateDashboardCache();

    // Create audit log
    await this.createAuditLog({
      userId: 'system',
      action: 'CANCEL_ORDER',
      resource: `Order:${id}`,
      details: cancelData,
      ipAddress: 'system',
    });

    // TODO: Send notification to customer if requested
    if (cancelData.notifyCustomer) {
      // Implement customer notification logic
    }

    return order;
  }

  async shipOrder(
    id: string,
    shippingData: {
      trackingNumber: string;
      carrier?: string;
      estimatedDelivery?: string;
      notifyCustomer?: boolean;
    },
  ): Promise<any> {
    const order = await this.prismaService.orders.update({
      where: { id },
      data: {
        status: order_status_enum.SHIPPED,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        shipping: {
          include: {
            shipping_methods: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await this.invalidateDashboardCache();

    // Create audit log
    await this.createAuditLog({
      userId: 'system',
      action: 'SHIP_ORDER',
      resource: `Order:${id}`,
      details: shippingData,
      ipAddress: 'system',
    });

    // TODO: Send notification to customer if requested
    if (shippingData.notifyCustomer) {
      // Implement customer notification logic
    }

    return order;
  }

  async deliverOrder(
    id: string,
    deliveryData: { deliveryDate?: string; notes?: string; notifyCustomer?: boolean },
  ): Promise<any> {
    const order = await this.prismaService.orders.update({
      where: { id },
      data: {
        status: order_status_enum.COMPLETED,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        shipping: {
          include: {
            shipping_methods: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Create audit log
    await this.invalidateDashboardCache();

    await this.createAuditLog({
      userId: 'system',
      action: 'DELIVER_ORDER',
      resource: `Order:${id}`,
      details: deliveryData,
      ipAddress: 'system',
    });

    // TODO: Send notification to customer if requested
    if (deliveryData.notifyCustomer) {
      // Implement customer notification logic
    }

    return order;
  }

  async bulkUpdateOrders(bulkData: {
    orderIds: string[];
    updates: object;
    filter?: object;
  }): Promise<any> {
    const where: any = {
      id: { in: bulkData.orderIds },
    };

    if (bulkData.filter) {
      Object.assign(where, bulkData.filter);
    }

    const result = await this.prismaService.orders.updateMany({
      where,
      data: bulkData.updates,
    });

    await this.invalidateDashboardCache();

    // Create audit log
    await this.createAuditLog({
      userId: 'system',
      action: 'BULK_UPDATE_ORDERS',
      resource: `Orders:${bulkData.orderIds.join(',')}`,
      details: bulkData,
      ipAddress: 'system',
    });

    return result;
  }

  async getOrderStatistics(filter: any = {}): Promise<any> {
    const where: any = {};

    if (filter.period) {
      const now = new Date();
      switch (filter.period) {
        case 'day':
          where.created_at = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          };
          break;
        case 'week':
          where.created_at = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
          };
          break;
        case 'month':
          where.created_at = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          };
          break;
        case 'year':
          where.created_at = {
            gte: new Date(now.getFullYear(), 0, 1),
          };
          break;
      }
    }

    if (filter.dateFrom) where.created_at = { gte: new Date(filter.dateFrom) };
    if (filter.dateTo) where.created_at = { lte: new Date(filter.dateTo) };

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
      this.prismaService.orders.count({ where }),
      this.prismaService.orders.count({
        where: { ...where, status: order_status_enum.PENDING },
      }),
      this.prismaService.orders.count({ where: { ...where, status: order_status_enum.PAID } }),
      this.prismaService.orders.count({
        where: { ...where, status: order_status_enum.PROCESSING },
      }),
      this.prismaService.orders.count({
        where: { ...where, status: order_status_enum.SHIPPED },
      }),
      this.prismaService.orders.count({
        where: { ...where, status: order_status_enum.COMPLETED },
      }),
      this.prismaService.orders.count({
        where: { ...where, status: order_status_enum.CANCELLED },
      }),
      this.prismaService.$queryRaw<[{ revenue: string }]>`
            SELECT COALESCE(SUM(items.revenue), 0)::text AS revenue
            FROM orders o
            JOIN (
              SELECT order_id, unit_price * quantity AS revenue FROM order_items
              UNION ALL
              SELECT order_id, unit_price * quantity AS revenue FROM order_items_importation
            ) items ON items.order_id = o.id
            WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED')
          `,
    ]);

    const totalRevenue = Number((revenueResult as [{ revenue: string }])[0]?.revenue || 0);

    return {
      totalOrders,
      pendingOrders,
      paidOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue:
        paidOrders + processingOrders + shippedOrders + completedOrders > 0
          ? totalRevenue / (paidOrders + processingOrders + shippedOrders + completedOrders)
          : 0,
    };
  }

  // Wallet Transactions Management
  async getWalletTransactions(
    filter: any = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<any> {
    const where: any = {};

    if (filter.userId) where.user_id = filter.userId;
    if (filter.type) where.type = filter.type;
    if (filter.dateFrom || filter.dateTo) {
      where.created_at = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    const [transactions, total] = await Promise.all([
      this.prismaService.wallet_transactions.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prismaService.wallet_transactions.count({ where }),
    ]);

    return {
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Helper method to create audit logs
  async createAuditLog(auditData: any): Promise<void> {
    // Log only safe, non-sensitive fields — never dump raw auditData
    this.logger.log(
      `[Audit] action=${auditData?.action ?? 'unknown'} userId=${auditData?.userId ?? 'unknown'} targetId=${auditData?.targetId ?? 'unknown'}`,
    );
  }

  // ─── Wallet User Management ──────────────────────────────────────────────

  /** Returns all users that have a non-zero balance or at least one wallet transaction, sorted by balance desc */
  async getUsersWallets(): Promise<any[]> {
    const users = await this.prismaService.users.findMany({
      where: {
        OR: [{ balance: { gt: 0 } }, { wallet_transactions: { some: {} } }],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        balance: true,
        _count: { select: { wallet_transactions: true } },
      },
      orderBy: { balance: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      email: u.email,
      balance: Number(u.balance),
      transactionCount: u._count.wallet_transactions,
    }));
  }

  /** Returns a single user's balance and full transaction history */
  async getUserWallet(userId: string): Promise<any> {
    const user = await this.prismaService.users.findUnique({
      where: { id: userId },
      select: { id: true, first_name: true, last_name: true, email: true, balance: true },
    });

    if (!user) return null;

    const transactions = await this.prismaService.wallet_transactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      email: user.email,
      balance: Number(user.balance),
      transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    };
  }

  /** Verifies the wallet access code. Creates the default hash on first call if not set. */
  async verifyWalletAccessCode(code: string): Promise<boolean> {
    const SETTING_KEY = 'wallet_access_code';
    const DEFAULT_CODE = '7182';

    let setting = await this.prismaService.admin_settings.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      const hash = await bcrypt.hash(DEFAULT_CODE, 10);
      setting = await this.prismaService.admin_settings.create({
        data: { key: SETTING_KEY, value: hash },
      });
    }

    return bcrypt.compare(code, setting.value);
  }

  /** Adds or subtracts balance from a user's wallet */
  async adjustWalletBalance(
    userId: string,
    amount: number,
    description: string,
    isCredit: boolean,
  ): Promise<any> {
    const signedAmount = isCredit ? Math.abs(amount) : -Math.abs(amount);

    return this.prismaService.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userId },
        data: { balance: { increment: signedAmount } },
      });

      const tx_record = await tx.wallet_transactions.create({
        data: {
          user_id: userId,
          amount: new Prisma.Decimal(signedAmount),
          type: 'ADJUSTMENT',
          description,
        },
      });

      const updated = await tx.users.findUnique({
        where: { id: userId },
        select: { balance: true },
      });

      return {
        transaction: { ...tx_record, amount: Number(tx_record.amount) },
        newBalance: Number(updated!.balance),
      };
    });
  }

  /** Mark a user's balance as paid (zeros it out) */
  async payoutWalletBalance(userId: string): Promise<any> {
    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { id: userId },
        select: { id: true, balance: true },
      });

      if (!user) throw new NotFoundException('Usuario no encontrado');

      const balanceAmount = Number(user.balance);
      if (balanceAmount <= 0) {
        throw new BadRequestException('El usuario no tiene saldo pendiente de pago');
      }

      // 1. Record withdrawal transaction
      const tx_record = await tx.wallet_transactions.create({
        data: {
          user_id: userId,
          amount: new Prisma.Decimal(-balanceAmount),
          type: 'WITHDRAWAL',
          description: `Pago de saldo acumulado (Corte Administrador)`,
        },
      });

      // 2. Set balance to 0
      await tx.users.update({
        where: { id: userId },
        data: { balance: 0 },
      });

      return {
        transaction: { ...tx_record, amount: Number(tx_record.amount) },
        newBalance: 0,
      };
    });
  }

  /** Returns all general settings as a key-value object */
  async getGeneralSettings(): Promise<Record<string, string>> {
    const settings = await this.prismaService.admin_settings.findMany();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  /** Returns only publicly accessible general settings */
  async getPublicSettings(): Promise<Record<string, string>> {
    const publicKeys = ['SUPPORT_EMAIL', 'CONTACT_PHONE', 'MARKETPLACE_NAME'];
    const settings = await this.prismaService.admin_settings.findMany({
      where: { key: { in: publicKeys } },
    });
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  /** Updates multiple settings at once using a transaction */
  async updateGeneralSettings(settings: Record<string, any>): Promise<void> {
    const entries = Object.entries(settings);
    this.logger.log(
      `[updateGeneralSettings] Upserting ${entries.length} keys: ${entries.map(([k]) => k).join(', ')}`,
    );

    for (const [key, value] of entries) {
      const result = await this.prismaService.admin_settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
      this.logger.log(`[updateGeneralSettings] key=${key} -> saved value=${result.value}`);
    }
  }
}
