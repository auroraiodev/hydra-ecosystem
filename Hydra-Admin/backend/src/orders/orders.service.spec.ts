import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { PaymentsService } from '../payments/payments.service';
import { ConfigService } from '@nestjs/config';
import { ImportationService } from '../../apps/catalog/src/importation/importation.service.js';
import { CurrencyService } from '../../apps/catalog/src/importation/currency.service.js';
import { CacheService } from '../common/cache/cache.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrisma: any;
  let mockCartService: any;
  let mockPaymentsService: any;
  let mockEmailService: any;
  let mockCacheService: any;

  beforeEach(async () => {
    mockPrisma = {
      orders: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      payments: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      users: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      wallet_transactions: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      order_items: { deleteMany: jest.fn() },
      order_items_importation: { deleteMany: jest.fn() },
      order_shipping: { deleteMany: jest.fn() },
      singles: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      listings: { updateMany: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(mockPrisma)),
      $queryRawUnsafe: jest.fn(),
    };

    mockCartService = {
      getOrCreateCart: jest.fn(),
      clearCart: jest.fn().mockResolvedValue(undefined),
      addItem: jest.fn(),
    };

    mockPaymentsService = {
      createPayment: jest.fn(),
      createMercadoPagoPreference: jest.fn(),
      verifyPayment: jest.fn(),
      updatePayment: jest.fn(),
      mapMercadoPagoStatus: jest.fn(),
    };

    mockEmailService = {
      sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
      sendCustomerPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
      sendPurchaseNotification: jest.fn().mockResolvedValue(undefined),
      sendCustomerConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    mockCacheService = {
      invalidateHomePage: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CartService, useValue: mockCartService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') },
        },
        { provide: ImportationService, useValue: { getImportationPricing: jest.fn() } },
        { provide: CurrencyService, useValue: { convertJPYToMXN: jest.fn() } },
        { provide: EmailService, useValue: mockEmailService },
        { provide: CacheService, useValue: mockCacheService },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── payWithWallet ───────────────────────────────────────────────────────────

  describe('payWithWallet', () => {
    const userId = 'user-1';
    const orderId = 'order-1';

    const mockOrder = {
      id: orderId,
      user_id: userId,
      status: 'PENDING',
      import_fee: null,
      items: [
        {
          id: 'item-1',
          single_id: 'single-1',
          quantity: 2,
          unit_price: '50.00',
          is_delivered: false,
          singles: { cardName: 'Test Card', name: 'Test Card', img: '' },
        },
      ],
      importation_items: [],
      shipping: null,
      payments: [],
      created_at: new Date(),
      estimated_delivery_at: null,
      arrived_at: null,
      delivered_at: null,
      users: null,
    };

    it('throws NotFoundException when order not found', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue(null);
      await expect(service.payWithWallet(userId, orderId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when order belongs to different user', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue({ ...mockOrder, user_id: 'other-user' });
      await expect(service.payWithWallet(userId, orderId)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when order is not PENDING', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue({ ...mockOrder, status: 'PAID' });
      await expect(service.payWithWallet(userId, orderId)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when balance is insufficient (total=100, balance=50)', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue(mockOrder);
      // total = 2 * 50 = 100; balance = 50 → insufficient
      mockPrisma.users.findUnique.mockResolvedValue({ id: userId, balance: '50.00' });

      await expect(service.payWithWallet(userId, orderId)).rejects.toThrow(BadRequestException);
    });

    it('deducts balance, records PURCHASE transaction, creates approved payment on success', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue(mockOrder);
      // total = 100; balance = 200 → sufficient
      mockPrisma.users.findUnique.mockResolvedValue({ id: userId, balance: '200.00' });
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.wallet_transactions.create.mockResolvedValue({});
      mockPrisma.payments.create.mockResolvedValue({ id: 'payment-1' });

      jest.spyOn(service as any, 'finalizePaidOrder').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'sendOrderCompletionEmails').mockResolvedValue(undefined);

      const result = await service.payWithWallet(userId, orderId);

      expect(result).toEqual({ success: true });

      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { balance: { decrement: 100 } },
        }),
      );

      expect(mockPrisma.wallet_transactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: userId,
            type: 'PURCHASE',
            order_id: orderId,
          }),
        }),
      );

      expect(mockPrisma.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order_id: orderId,
            payment_method: 'wallet',
            status: 'approved',
          }),
        }),
      );
    });
  });

  // ─── handleOrderPaymentUpdate – CANCELLED ────────────────────────────────────

  describe('handleOrderPaymentUpdate - CANCELLED with mixed payment', () => {
    const orderId = 'order-1';
    const userId = 'user-1';

    const pendingOrder = {
      id: orderId,
      user_id: userId,
      status: 'PENDING',
      items: [],
      created_at: new Date(),
    };

    it('refunds wallet_amount for wallet_plus_mercadopago cancellation', async () => {
      const walletAmount = 150;
      mockPrisma.orders.findUnique.mockResolvedValue(pendingOrder);
      mockPrisma.payments.findFirst.mockResolvedValue({
        id: 'pay-1',
        payment_method: 'wallet_plus_mercadopago',
        payment_data: { wallet_amount: walletAmount, remainder: 50 },
      });
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.wallet_transactions.create.mockResolvedValue({});
      mockPrisma.orders.update.mockResolvedValue({});

      await service.handleOrderPaymentUpdate(orderId, 'CANCELLED');

      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { balance: { increment: walletAmount } },
        }),
      );

      expect(mockPrisma.wallet_transactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: userId,
            type: 'ORDER_REFUND',
            order_id: orderId,
          }),
        }),
      );

      expect(mockPrisma.orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        }),
      );
    });

    it('refunds wallet_amount for wallet_plus_transfer cancellation', async () => {
      const walletAmount = 80;
      mockPrisma.orders.findUnique.mockResolvedValue(pendingOrder);
      mockPrisma.payments.findFirst.mockResolvedValue({
        id: 'pay-1',
        payment_method: 'wallet_plus_transfer',
        payment_data: { wallet_amount: walletAmount, remainder: 120 },
      });
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.wallet_transactions.create.mockResolvedValue({});
      mockPrisma.orders.update.mockResolvedValue({});

      await service.handleOrderPaymentUpdate(orderId, 'CANCELLED');

      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { balance: { increment: walletAmount } },
        }),
      );
    });

    it('does NOT refund wallet for regular mercadopago cancellation', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue(pendingOrder);
      mockPrisma.payments.findFirst.mockResolvedValue({
        id: 'pay-1',
        payment_method: 'mercadopago',
        payment_data: { preference: {} },
      });
      mockPrisma.orders.update.mockResolvedValue({});

      await service.handleOrderPaymentUpdate(orderId, 'CANCELLED');

      const balanceIncrements = (mockPrisma.users.update.mock.calls as any[][]).filter(
        (call) => call[0]?.data?.balance?.increment !== undefined,
      );
      expect(balanceIncrements).toHaveLength(0);
    });

    it('does nothing when order is not found', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue(null);

      await service.handleOrderPaymentUpdate(orderId, 'CANCELLED');

      expect(mockPrisma.orders.update).not.toHaveBeenCalled();
      expect(mockPrisma.payments.findFirst).not.toHaveBeenCalled();
    });

    it('calls finalizePaidOrder when status is PAID', async () => {
      mockPrisma.orders.findUnique.mockResolvedValue(pendingOrder);
      jest.spyOn(service as any, 'finalizePaidOrder').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'sendOrderCompletionEmails').mockResolvedValue(undefined);

      await service.handleOrderPaymentUpdate(orderId, 'PAID');

      expect((service as any).finalizePaidOrder).toHaveBeenCalledWith(orderId, expect.anything());
    });
  });

  // ─── verifyAndUpdatePayment ──────────────────────────────────────────────────

  describe('verifyAndUpdatePayment', () => {
    const userId = 'user-1';
    const orderId = 'order-1';
    const mpPaymentId = 'mp-pay-123';

    it('throws BadRequestException when paymentId is empty', async () => {
      await expect(service.verifyAndUpdatePayment(orderId, userId, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects transfer payment method (not an MP order)', async () => {
      mockPrisma.orders.findFirst.mockResolvedValue({
        id: orderId,
        user_id: userId,
        status: 'PENDING',
        payments: [{ id: 'pay-1', payment_method: 'transfer', status: 'pending' }],
      });

      const result = await service.verifyAndUpdatePayment(orderId, userId, mpPaymentId);

      expect(result).toEqual({ verified: false, message: 'Not a Mercado Pago order' });
    });

    it('rejects pure wallet payment method (not an MP order)', async () => {
      mockPrisma.orders.findFirst.mockResolvedValue({
        id: orderId,
        user_id: userId,
        status: 'PENDING',
        payments: [{ id: 'pay-1', payment_method: 'wallet', status: 'approved' }],
      });

      const result = await service.verifyAndUpdatePayment(orderId, userId, mpPaymentId);

      expect(result).toEqual({ verified: false, message: 'Not a Mercado Pago order' });
    });

    it('proceeds to verification for wallet_plus_mercadopago (not rejected as non-MP)', async () => {
      mockPrisma.orders.findFirst.mockResolvedValue({
        id: orderId,
        user_id: userId,
        status: 'PENDING',
        payments: [{ id: 'pay-1', payment_method: 'wallet_plus_mercadopago', status: 'pending' }],
      });
      mockPaymentsService.verifyPayment.mockResolvedValue({ verified: false, status: 'pending' });

      const result = await service.verifyAndUpdatePayment(orderId, userId, mpPaymentId);

      expect(result).not.toEqual({ verified: false, message: 'Not a Mercado Pago order' });
      expect(mockPaymentsService.verifyPayment).toHaveBeenCalledWith(mpPaymentId);
    });

    it('proceeds to verification for regular mercadopago', async () => {
      mockPrisma.orders.findFirst.mockResolvedValue({
        id: orderId,
        user_id: userId,
        status: 'PENDING',
        payments: [{ id: 'pay-1', payment_method: 'mercadopago', status: 'pending' }],
      });
      mockPaymentsService.verifyPayment.mockResolvedValue({ verified: false, status: 'pending' });

      const result = await service.verifyAndUpdatePayment(orderId, userId, mpPaymentId);

      expect(result).not.toEqual({ verified: false, message: 'Not a Mercado Pago order' });
      expect(mockPaymentsService.verifyPayment).toHaveBeenCalledWith(mpPaymentId);
    });

    it('returns already-processed status for non-PENDING order', async () => {
      mockPrisma.orders.findFirst.mockResolvedValue({
        id: orderId,
        user_id: userId,
        status: 'PAID',
        payments: [{ id: 'pay-1', payment_method: 'wallet_plus_mercadopago', status: 'approved' }],
      });

      const result = await service.verifyAndUpdatePayment(orderId, userId, mpPaymentId);

      expect(result).toEqual({ verified: true, status: 'PAID' });
      expect(mockPaymentsService.verifyPayment).not.toHaveBeenCalled();
    });
  });

  // ─── enrichOrder – wallet breakdown ─────────────────────────────────────────

  describe('enrichOrder - wallet payment breakdown', () => {
    const baseOrder = {
      id: 'order-1',
      user_id: 'user-1',
      status: 'PENDING',
      import_fee: null,
      importation_items: [],
      shipping: null,
      created_at: new Date(),
      estimated_delivery_at: null,
      arrived_at: null,
      delivered_at: null,
      users: null,
    };

    it('returns walletApplied and remainingToPay for wallet_plus_mercadopago', async () => {
      const order = {
        ...baseOrder,
        items: [
          {
            id: 'item-1',
            single_id: 'single-1',
            quantity: 1,
            unit_price: '200.00',
            is_delivered: false,
            singles: { cardName: 'Test Card', name: 'Test Card', img: '' },
          },
        ],
        payments: [
          {
            id: 'pay-1',
            payment_method: 'wallet_plus_mercadopago',
            mercadopago_payment_id: null,
            mercadopago_preference_id: 'pref-1',
            status: 'pending',
            payment_data: { wallet_amount: 50, remainder: 150 },
          },
        ],
      };

      const result = await (service as any).enrichOrder(order);

      expect(result.total).toBe('200.00');
      expect(result.walletApplied).toBe('50.00');
      expect(result.remainingToPay).toBe('150.00');
      expect(result.payment?.paymentMethod).toBe('wallet_plus_mercadopago');
    });

    it('returns walletApplied and remainingToPay for wallet_plus_transfer', async () => {
      const order = {
        ...baseOrder,
        items: [
          {
            id: 'item-1',
            single_id: 'single-1',
            quantity: 2,
            unit_price: '100.00',
            is_delivered: false,
            singles: { cardName: 'Test Card', name: 'Test Card', img: '' },
          },
        ],
        payments: [
          {
            id: 'pay-1',
            payment_method: 'wallet_plus_transfer',
            mercadopago_payment_id: null,
            mercadopago_preference_id: null,
            status: 'pending',
            payment_data: { wallet_amount: 75, remainder: 125 },
          },
        ],
      };

      const result = await (service as any).enrichOrder(order);

      expect(result.total).toBe('200.00');
      expect(result.walletApplied).toBe('75.00');
      expect(result.remainingToPay).toBe('125.00');
    });

    it('returns full order total as walletApplied and 0 remainingToPay for pure wallet', async () => {
      const order = {
        ...baseOrder,
        status: 'PAID',
        items: [
          {
            id: 'item-1',
            single_id: 'single-1',
            quantity: 1,
            unit_price: '300.00',
            is_delivered: true,
            singles: { cardName: 'Test Card', name: 'Test Card', img: '' },
          },
        ],
        payments: [
          {
            id: 'pay-1',
            payment_method: 'wallet',
            mercadopago_payment_id: null,
            mercadopago_preference_id: null,
            status: 'approved',
            payment_data: { total_paid: 300 },
          },
        ],
      };

      const result = await (service as any).enrichOrder(order);

      expect(result.walletApplied).toBe('300.00');
      expect(result.remainingToPay).toBe('0.00');
    });

    it('returns undefined walletApplied for regular mercadopago payment', async () => {
      const order = {
        ...baseOrder,
        items: [
          {
            id: 'item-1',
            single_id: 'single-1',
            quantity: 1,
            unit_price: '150.00',
            is_delivered: false,
            singles: { cardName: 'Test Card', name: 'Test Card', img: '' },
          },
        ],
        payments: [
          {
            id: 'pay-1',
            payment_method: 'mercadopago',
            mercadopago_payment_id: null,
            mercadopago_preference_id: 'pref-1',
            status: 'pending',
            payment_data: { preference: {} },
          },
        ],
      };

      const result = await (service as any).enrichOrder(order);

      expect(result.walletApplied).toBeUndefined();
      expect(result.remainingToPay).toBeUndefined();
      expect(result.total).toBe('150.00');
    });

    it('sums multiple items correctly in total', async () => {
      const order = {
        ...baseOrder,
        items: [
          {
            id: 'item-1',
            single_id: 'single-1',
            quantity: 3,
            unit_price: '100.00',
            is_delivered: false,
            singles: { cardName: 'Card A', name: 'Card A', img: '' },
          },
          {
            id: 'item-2',
            single_id: 'single-2',
            quantity: 1,
            unit_price: '250.00',
            is_delivered: false,
            singles: { cardName: 'Card B', name: 'Card B', img: '' },
          },
        ],
        payments: [
          {
            id: 'pay-1',
            payment_method: 'wallet_plus_mercadopago',
            mercadopago_payment_id: null,
            mercadopago_preference_id: 'pref-1',
            status: 'pending',
            payment_data: { wallet_amount: 200, remainder: 350 },
          },
        ],
      };

      const result = await (service as any).enrichOrder(order);

      expect(result.total).toBe('550.00'); // 3*100 + 1*250 = 550
      expect(result.walletApplied).toBe('200.00');
      expect(result.remainingToPay).toBe('350.00');
    });
  });
});
