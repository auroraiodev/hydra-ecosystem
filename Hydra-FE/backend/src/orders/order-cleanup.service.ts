import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class OrderCleanupService {
  private readonly logger = new Logger(OrderCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean up abandoned Mercado Pago orders
   * Runs every hour and deletes orders that:
   * - Have payment_method = 'mercadopago'
   * - Have payment status = 'pending'
   * - Were created more than 2 hours ago
   * - Have order status = 'PENDING'
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupAbandonedMercadoPagoOrders() {
    try {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      this.logger.log('Starting cleanup of abandoned Mercado Pago orders...');

      // Find abandoned orders
      const abandonedOrders = await (this.prisma as any).orders.findMany({
        where: {
          status: 'PENDING',
          created_at: {
            lt: twoHoursAgo,
          },
          payments: {
            some: {
              payment_method: 'mercadopago',
              status: 'pending',
            },
          },
        },
        include: {
          payments: true,
          items: true,
          importation_items: true,
        },
      });

      if (abandonedOrders.length === 0) {
        this.logger.log('No abandoned Mercado Pago orders found');
        return;
      }

      this.logger.log(`Found ${abandonedOrders.length} abandoned Mercado Pago orders to clean up`);

      // Delete each abandoned order (this will restore stock via the existing delete logic)
      for (const order of abandonedOrders) {
        try {
          // Delete order items first
          await (this.prisma as any).order_items.deleteMany({
            where: { order_id: order.id },
          });

          await (this.prisma as any).order_items_importation.deleteMany({
            where: { order_id: order.id },
          });

          // Delete payments
          await (this.prisma as any).payments.deleteMany({
            where: { order_id: order.id },
          });

          // Delete shipping info if exists
          await (this.prisma as any).order_shipping.deleteMany({
            where: { order_id: order.id },
          });

          // NOTE: We do NOT restore stock for PENDING orders during cleanup
          // because stock is only deducted when the order is marked as PAID or validated in createOrder.
          // Since this cleanup only targets abandoned PENDING orders created > 2 hours ago,
          // those items were never officially "sold" (stock not deducted in finalization).
          // If we restored it here, we would be artificially increasing stock.

          // Delete the order
          await (this.prisma as any).orders.delete({
            where: { id: order.id },
          });

          this.logger.log(`Deleted abandoned order ${order.id} (created at ${order.created_at})`);
        } catch (error) {
          this.logger.error(`Failed to delete abandoned order ${order.id}:`, error);
        }
      }

      this.logger.log(`Cleanup completed. Deleted ${abandonedOrders.length} abandoned orders`);
    } catch (error) {
      this.logger.error('Error during abandoned order cleanup:', error);
    }
  }

  /**
   * Manual cleanup method for testing or admin use
   */
  async manualCleanup() {
    await this.cleanupAbandonedMercadoPagoOrders();
  }
}
