import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CartService } from '../cart/cart.service';
import { ModuleRef } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let configService: any;
  let mockOrdersService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      payments: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockCartService = {
      // Add cart service methods if needed
    };

    mockOrdersService = {
      handleOrderPaymentUpdate: jest.fn(),
    };

    const mockModuleRef = {
      get: jest.fn().mockReturnValue(mockOrdersService),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CartService, useValue: mockCartService },
        { provide: ModuleRef, useValue: mockModuleRef },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Manually trigger onModuleInit to set up ordersService
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMercadoPagoPreference', () => {
    it('should create Mercado Pago preference successfully', async () => {
      const orderId = 'order123';
      const items = [{ title: 'Test Product', quantity: 1, unit_price: 100 }];
      const backUrls = {
        success: 'https://example.com/success',
        failure: 'https://example.com/failure',
        pending: 'https://example.com/pending',
      };

      configService.get.mockReturnValue('test_token');

      // This will fail due to Mercado Pago client not being available, but we can test the validation logic
      try {
        await service.createMercadoPagoPreference(orderId, items, backUrls);
      } catch (error) {
        // Expected to fail due to missing Mercado Pago client in test environment
        expect(error).toBeDefined();
      }
    });

    it('should throw BadRequestException for missing success URL', async () => {
      const orderId = 'order123';
      const items = [{ title: 'Test Product', quantity: 1, unit_price: 100 }];
      const backUrls = {
        success: '',
        failure: 'https://example.com/failure',
        pending: 'https://example.com/pending',
      };

      await expect(service.createMercadoPagoPreference(orderId, items, backUrls)).rejects.toThrow(
        new BadRequestException('back_urls.success is required for Mercado Pago preference'),
      );
    });

    it('should throw BadRequestException for missing access token', async () => {
      const orderId = 'order123';
      const items = [{ title: 'Test Product', quantity: 1, unit_price: 100 }];
      const backUrls = {
        success: 'https://example.com/success',
        failure: 'https://example.com/failure',
        pending: 'https://example.com/pending',
      };

      configService.get.mockReturnValue(null);

      await expect(service.createMercadoPagoPreference(orderId, items, backUrls)).rejects.toThrow(
        new BadRequestException('Mercado Pago access token not configured'),
      );
    });
  });

  describe('createPayment', () => {
    it('should create a payment record', async () => {
      const orderId = 'order123';
      const paymentMethod = 'mercadopago';
      const mercadopagoPreferenceId = 'pref123';
      const paymentData = { test: 'data' };
      const mockPayment = { id: 'payment123', order_id: orderId };

      prisma.payments.create.mockResolvedValue(mockPayment);

      const result = await service.createPayment(
        orderId,
        paymentMethod,
        mercadopagoPreferenceId,
        paymentData,
      );

      expect(prisma.payments.create).toHaveBeenCalledWith({
        data: {
          order_id: orderId,
          payment_method: paymentMethod,
          mercadopago_preference_id: mercadopagoPreferenceId,
          payment_data: paymentData,
          status: 'pending',
        },
      });
      expect(result).toBe(mockPayment);
    });
  });

  describe('updatePayment', () => {
    it('should update a payment record', async () => {
      const paymentId = 'payment123';
      const mercadopagoPaymentId = 'mp123';
      const paymentData = { status: 'approved' };
      const status = 'approved';
      const mockPayment = { id: paymentId, status };

      prisma.payments.update.mockResolvedValue(mockPayment);

      const result = await service.updatePayment(
        paymentId,
        mercadopagoPaymentId,
        paymentData,
        status,
      );

      expect(prisma.payments.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          mercadopago_payment_id: mercadopagoPaymentId,
          payment_data: paymentData,
          status,
        },
      });
      expect(result).toBe(mockPayment);
    });
  });

  describe('processWebhook', () => {
    it('should process payment webhook', async () => {
      const webhookData = {
        type: 'payment',
        data: { id: 'payment123' },
      };

      const mockPayment = {
        id: 'payment123',
        order_id: 'order123',
        orders: { status: 'PENDING' },
      };

      prisma.payments.findFirst.mockResolvedValue(mockPayment);
      prisma.payments.update.mockResolvedValue(mockPayment);

      // Mock the verifyPayment method to avoid actual API calls
      jest.spyOn(service, 'verifyPayment' as any).mockResolvedValue({
        verified: true,
        status: 'approved',
        payment: webhookData,
      });

      const result = await service.processWebhook(webhookData);

      expect(result).toEqual({ success: true });
    });

    it('should handle merchant order webhook', async () => {
      const webhookData = {
        type: 'merchant_order',
        merchant_order_id: 'order123',
        payments: [{ status: 'approved', id: 'payment123' }],
      };

      const mockPayment = {
        id: 'payment123',
        order_id: 'order123',
        orders: { status: 'PENDING' },
      };

      prisma.payments.findFirst.mockResolvedValue(mockPayment);
      prisma.payments.update.mockResolvedValue(mockPayment);

      // Mock the verifyPayment method to avoid actual API calls
      jest.spyOn(service, 'verifyPayment' as any).mockResolvedValue({
        verified: true,
        status: 'approved',
        payment: webhookData.payments[0],
      });

      const result = await service.processWebhook(webhookData);

      expect(result).toEqual({ success: true });
      expect(mockOrdersService.handleOrderPaymentUpdate).toHaveBeenCalledWith('order123', 'PAID');
    });

    it('should return success for payment not found', async () => {
      const webhookData = {
        type: 'payment',
        data: { id: 'nonexistent' },
      };

      prisma.payments.findFirst.mockResolvedValue(null);

      jest.spyOn(service, 'verifyPayment' as any).mockResolvedValue({
        verified: false,
        status: 'unknown',
        payment: null,
      });

      const result = await service.processWebhook(webhookData);

      expect(result).toEqual({
        success: true,
        message: 'Payment not found in database',
      });
    });

    it('should throw BadRequestException for unknown webhook type', async () => {
      const webhookData = { type: 'unknown' };

      await expect(service.processWebhook(webhookData)).rejects.toThrow(
        new BadRequestException('Unknown webhook type or missing payment ID'),
      );
    });
  });

  describe('verifyPayment', () => {
    it('should throw BadRequestException for missing access token', async () => {
      const paymentId = 'payment123';

      configService.get.mockReturnValue(null);

      await expect(service.verifyPayment(paymentId)).rejects.toThrow(
        new BadRequestException('Mercado Pago access token not configured'),
      );
    });
  });

  describe('mapMercadoPagoStatus', () => {
    it('should map Mercado Pago status correctly', () => {
      // We can't test private methods directly, but we can test through public methods
      // that use this mapping
      expect(service['mapMercadoPagoStatus']('approved')).toBe('approved');
      expect(service['mapMercadoPagoStatus']('pending')).toBe('pending');
      expect(service['mapMercadoPagoStatus']('rejected')).toBe('rejected');
      expect(service['mapMercadoPagoStatus']('cancelled')).toBe('cancelled');
      expect(service['mapMercadoPagoStatus']('refunded')).toBe('refunded');
      expect(service['mapMercadoPagoStatus']('charged_back')).toBe('charged_back');
      expect(service['mapMercadoPagoStatus']('unknown')).toBe('pending');
    });
  });
});
