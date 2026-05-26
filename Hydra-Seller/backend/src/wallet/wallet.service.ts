import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';
import { NotificationsService, NotificationType } from '../notifications/notifications.service.js';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getWalletData(userId: string) {
    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
      select: {
        balance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactions = await (this.prisma as any).wallet_transactions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return {
      balance: Number(user.balance),
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    };
  }

  async requestWithdrawal(userId: string, amount: number, details: string) {
    const transaction = await (this.prisma as any).$transaction(async (tx) => {
      const user = await tx.users.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (Number(user.balance) < amount) {
        throw new BadRequestException('Saldo insuficiente para el retiro.');
      }

      // Deduct balance
      await tx.users.update({
        where: { id: userId },
        data: {
          balance: { decrement: amount },
        },
      });

      // Create transaction record
      return tx.wallet_transactions.create({
        data: {
          user_id: userId,
          amount: new Prisma.Decimal(-amount),
          type: 'WITHDRAWAL',
          description: `Retiro de efectivo: ${details}`,
        },
      });
    });

    // Notify user of withdrawal request
    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.WALLET_TX,
      title: 'Retiro Solicitado',
      message: `Tu solicitud de retiro por $${amount.toFixed(2)} ha sido registrada.`,
      data: { amount, type: 'WITHDRAWAL' },
    });

    // Notify Admins about the withdrawal request
    await this.notificationsService.notifyAdmins({
      type: NotificationType.ADMIN_ALERT,
      title: 'Solicitud de Retiro',
      message: `El usuario con ID ${userId} ha solicitado un retiro de $${amount.toFixed(2)}.`,
      data: { userId, amount },
    });

    return transaction;
  }

  async requestOrderPayout(
    userId: string,
    totalAmount: number,
    orderIds: string[],
    description: string,
  ) {
    const user = await (this.prisma as any).users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Only notify — no transaction created until admin approves and transfers
    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.WALLET_TX,
      title: 'Solicitud de Cobro Enviada',
      message: `Tu solicitud de cobro por $${totalAmount.toFixed(2)} MXN ha sido enviada al administrador y será procesada pronto.`,
      data: { amount: totalAmount, orderIds, type: 'PAYOUT_REQUEST' },
    });

    await this.notificationsService.notifyAdmins({
      type: NotificationType.ADMIN_ALERT,
      title: '💰 Depósito Pendiente al Vendedor',
      message: `Por favor deposita $${totalAmount.toFixed(2)} MXN al vendedor ${user.first_name ?? ''} ${user.last_name ?? ''} (${user.email}) por ${orderIds.length} orden(es): ${orderIds.map((id) => id.slice(0, 8).toUpperCase()).join(', ')}. Datos bancarios: ${description}`,
      data: { userId, totalAmount, orderIds },
    });

    return { success: true, requestedAmount: totalAmount, orderCount: orderIds.length };
  }
}
