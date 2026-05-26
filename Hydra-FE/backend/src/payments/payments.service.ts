import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
type payments = any;
import { CartService } from '../cart/cart.service.js';
import { OrdersService } from '../orders/orders.service.js';
import * as crypto from 'crypto';

const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300;

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private ordersService: OrdersService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.ordersService = this.moduleRef.get(OrdersService, { strict: false });

    // Warn if using TEST credentials — payments will only work with MP test accounts
    const token = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (token?.startsWith('TEST-')) {
      this.logger.warn(
        '⚠️  MERCADOPAGO_ACCESS_TOKEN is a TEST token. Real payments will NOT work. ' +
          'Set a production APP_USR-... token for real transactions.',
      );
    }
  }

  /**
   * Create Mercado Pago preference
   */
  async createMercadoPagoPreference(
    orderId: string,
    items: Array<{
      title: string;
      quantity: number;
      unit_price: number;
    }>,
    backUrls: {
      success: string;
      failure: string;
      pending: string;
    },
    payer?: {
      email: string;
      name?: string;
      surname?: string;
      phone?: { area_code: string; number: string };
      identification?: { type: string; number: string };
      address?: { zip_code: string; street_name: string; street_number: string };
    },
  ) {
    this.logger.log(`Creating Mercado Pago preference for order ${orderId}`);

    // Validate back URLs
    if (!backUrls.success || backUrls.success.trim() === '') {
      throw new BadRequestException('back_urls.success is required for Mercado Pago preference');
    }

    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new BadRequestException('Mercado Pago access token not configured');
    }

    try {
      // Initialize Mercado Pago client
      const client = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
          idempotencyKey: orderId, // Use order ID as idempotency key
        },
      });

      const preference = new Preference(client);

      // Transform items to Mercado Pago format
      // MP requires unit_price with max 2 decimal places and positive values
      const mpItems = items
        .filter((item) => item.unit_price > 0)
        .map((item, index) => ({
          id: `item-${orderId}-${index}`,
          title: item.title || 'Producto',
          quantity: Math.max(1, Math.round(item.quantity)),
          unit_price: Math.round(item.unit_price * 100) / 100,
          currency_id: 'MXN',
        }));

      if (mpItems.length === 0) {
        throw new BadRequestException('No valid items for Mercado Pago preference');
      }

      const notificationUrl = this.configService.get<string>(
        'MERCADOPAGO_WEBHOOK_URL',
        `${this.configService.get<string>('API_URL', 'http://localhost:3002')}/api/v1/payments/webhook/mercadopago`,
      );

      // Mercado Pago rejects localhost webhooks, so exclude it in dev
      const isLocalhost =
        notificationUrl?.includes('localhost') || notificationUrl?.includes('127.0.0.1');

      const preferenceBody: any = {
        items: mpItems,
        back_urls: {
          success: backUrls.success,
          failure: backUrls.failure,
          pending: backUrls.pending,
        },
        auto_return: 'approved',
        external_reference: orderId,
        ...(isLocalhost ? {} : { notification_url: notificationUrl }),
        statement_descriptor: 'HYDRA COLLECTABLES',
      };

      // Include payer info for better approval rates and fraud prevention
      if (payer?.email) {
        preferenceBody.payer = {
          email: payer.email,
          ...(payer.name && { name: payer.name }),
          ...(payer.surname && { surname: payer.surname }),
          ...(payer.phone && { phone: payer.phone }),
          ...(payer.identification && { identification: payer.identification }),
          ...(payer.address && { address: payer.address }),
        };
      }

      // Payment method configuration
      preferenceBody.payment_methods = {
        installments: 12, // Max installments allowed
        default_installments: 1,
      };

      this.logger.log(`Creating Preference with body: ${JSON.stringify(preferenceBody)}`);

      // Create preference
      const response = await preference.create({
        body: preferenceBody,
      });

      const initPoint = response.init_point || response.sandbox_init_point;
      this.logger.log(
        `Mercado Pago preference created: ${response.id} for order ${orderId}. ` +
          `Using ${response.init_point ? 'PRODUCTION' : 'SANDBOX'} init_point.`,
      );

      if (!response.init_point && response.sandbox_init_point) {
        this.logger.warn(
          `Order ${orderId}: Using sandbox_init_point — real payments will NOT work. ` +
            'Ensure MERCADOPAGO_ACCESS_TOKEN is a production token (APP_USR-...).',
        );
      }

      return {
        preference_id: response.id,
        init_point: initPoint,
      };
    } catch (error: any) {
      this.logger.error(`Error creating Mercado Pago preference for order ${orderId}:`, error);
      throw new BadRequestException(
        'No se pudo iniciar el pago. Por favor intenta de nuevo o contacta a soporte.',
      );
    }
  }

  /**
   * Create payment record
   */
  async createPayment(
    orderId: string,
    paymentMethod: string,
    mercadopagoPreferenceId?: string,
    paymentData?: any,
  ): Promise<payments> {
    return await (this.prisma as any).payments.create({
      data: {
        order_id: orderId,
        payment_method: paymentMethod,
        mercadopago_preference_id: mercadopagoPreferenceId,

        payment_data: paymentData,
        status: 'pending',
      },
    });
  }

  /**
   * Update payment with Mercado Pago response
   */
  async updatePayment(
    paymentId: string,
    mercadopagoPaymentId: string,
    paymentData: any,
    status: string,
  ): Promise<payments> {
    return await (this.prisma as any).payments.update({
      where: { id: paymentId },
      data: {
        mercadopago_payment_id: mercadopagoPaymentId,

        payment_data: paymentData,
        status,
      },
    });
  }

  /**
   * Process Mercado Pago webhook
   * Mercado Pago sends different types of notifications:
   * - payment: when a payment is created/updated
   * - merchant_order: when an order is created/updated
   */
  async processWebhook(data: any) {
    this.logger.log('Processing Mercado Pago webhook', JSON.stringify(data));

    // Handle different webhook types
    const type: string | undefined = ((data as { type?: unknown })?.type ||
      (data as { action?: unknown })?.action) as string | undefined;

    if (type === 'payment' || (data as { data?: { id?: unknown } })?.data?.id) {
      // Payment notification
      return this.processPaymentWebhook(data);
    } else if (
      type === 'merchant_order' ||
      (data as { merchant_order_id?: unknown })?.merchant_order_id
    ) {
      // Merchant order notification - we can process this if needed
      this.logger.log('Received merchant_order notification, processing payment from order');
      // Mercado Pago merchant orders contain payment information
      // We'll process the payment from the order
      return this.processMerchantOrderWebhook(data);
    } else {
      // Try to extract payment ID from various possible structures
      const paymentId: string | number | undefined =
        ((data as { data?: { id?: unknown } })?.data?.id as string | number | undefined) ||
        ((data as { id?: unknown })?.id as string | number | undefined) ||
        ((data as { payment_id?: unknown })?.payment_id as string | number | undefined);
      if (paymentId) {
        return this.processPaymentWebhook({ data: { id: paymentId }, ...data });
      }

      throw new BadRequestException('Unknown webhook type or missing payment ID');
    }
  }

  /**
   * Process payment webhook
   *
   * The key challenge: when the webhook fires, the DB payment record only has
   * `mercadopago_preference_id` set (from order creation). The
   * `mercadopago_payment_id` is still NULL because no payment existed yet.
   * Mercado Pago webhooks send the payment ID, NOT the preference ID.
   *
   * Solution: Query the MP API first to get the full payment object which
   * includes `external_reference` (our order ID) and `preference_id`, then
   * use those to find the DB record.
   */
  private async processPaymentWebhook(data: any) {
    // Extract payment ID from webhook payload
    const paymentId: string | number | undefined =
      ((data as { data?: { id?: unknown } })?.data?.id as string | number | undefined) ||
      ((data as { id?: unknown })?.id as string | number | undefined);

    if (!paymentId) {
      throw new BadRequestException('Payment ID not found in webhook data');
    }

    // Step 1: Verify the payment with Mercado Pago API
    // This gives us authoritative status + external_reference (our order ID)
    let mpPaymentData: any = null;
    let mpStatus: string | undefined;

    try {
      const verification = await this.verifyPayment(paymentId.toString());
      if (
        verification &&
        typeof verification === 'object' &&
        'verified' in verification &&
        verification.verified
      ) {
        mpPaymentData = verification.payment;
        mpStatus = verification.status;
        this.logger.log(
          `Webhook: verified payment ${paymentId} with MP. Status: ${mpStatus}, ` +
            `external_reference: ${mpPaymentData?.external_reference}, ` +
            `preference_id: ${mpPaymentData?.preference_id}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to verify webhook payment ${paymentId} with MP API:`, error);
      throw new BadRequestException('Could not verify payment status with provider');
    }

    // Step 2: Find our payment record using multiple strategies
    let payment: any = null;

    // Strategy 1: By external_reference (order_id) from verified MP data — most reliable
    if (!payment && mpPaymentData?.external_reference) {
      payment = await (this.prisma as any).payments.findFirst({
        where: { order_id: mpPaymentData.external_reference as string },
        include: { orders: true },
      });
      if (payment) {
        this.logger.log(
          `Found payment by external_reference (order_id): ${mpPaymentData.external_reference}`,
        );
      }
    }

    // Strategy 2: By preference_id from verified MP data
    if (!payment && mpPaymentData?.preference_id) {
      payment = await (this.prisma as any).payments.findFirst({
        where: { mercadopago_preference_id: mpPaymentData.preference_id as string },
        include: { orders: true },
      });
      if (payment) {
        this.logger.log(`Found payment by preference_id: ${mpPaymentData.preference_id}`);
      }
    }

    // Strategy 3: By mercadopago_payment_id (for re-processed webhooks where it was already set)
    if (!payment) {
      payment = await (this.prisma as any).payments.findFirst({
        where: { mercadopago_payment_id: paymentId.toString() },
        include: { orders: true },
      });
    }

    if (!payment) {
      this.logger.warn(
        `Payment not found for webhook. MP Payment ID: ${paymentId}, ` +
          `external_reference: ${mpPaymentData?.external_reference}, ` +
          `preference_id: ${mpPaymentData?.preference_id}`,
      );
      return { success: true, message: 'Payment not found in database' };
    }

    // Step 3: Update payment record with verified data
    const finalStatus: string = mpStatus || 'pending';
    const paymentStatus = this.mapMercadoPagoStatus(finalStatus);

    await this.updatePayment(
      (payment as { id: string }).id,
      paymentId.toString(),
      mpPaymentData || data,
      paymentStatus,
    );

    // Step 4: Update order status based on payment status
    const orderStatus = (payment as { orders?: { status?: string } }).orders?.status;

    if (orderStatus === 'PENDING') {
      if (paymentStatus === 'approved') {
        await this.ordersService.handleOrderPaymentUpdate(
          (payment as { order_id: string }).order_id,
          'PAID',
        );
      } else if (
        paymentStatus === 'rejected' ||
        paymentStatus === 'cancelled' ||
        paymentStatus === 'charged_back'
      ) {
        await this.ordersService.handleOrderPaymentUpdate(
          (payment as { order_id: string }).order_id,
          'CANCELLED',
        );
      }
    }

    return { success: true };
  }

  /**
   * Process merchant order webhook
   */
  private async processMerchantOrderWebhook(data: any) {
    const merchantOrderId: string | number | undefined =
      ((data as { merchant_order_id?: unknown })?.merchant_order_id as
        | string
        | number
        | undefined) ||
      ((data as { data?: { id?: unknown } })?.data?.id as string | number | undefined);
    if (!merchantOrderId) {
      throw new BadRequestException('Merchant order ID not found');
    }

    // Merchant orders contain payment information
    // Process all payments to check their status
    const payments: any[] =
      ((data as { payments?: unknown })?.payments as any[]) ||
      ((data as { data?: { payments?: unknown } })?.data?.payments as any[]) ||
      [];

    if (payments.length === 0) {
      this.logger.log(`Merchant order ${merchantOrderId} received but no payments found`);
      return { success: true, message: 'No payments in merchant order' };
    }

    // Find the most recent or relevant payment (prefer approved, then rejected, then pending)

    const approvedPayment: any = payments.find(
      (p: any) => (p as { status?: unknown }).status === 'approved',
    );

    const rejectedPayment: any = payments.find(
      (p: any) =>
        (p as { status?: unknown }).status === 'rejected' ||
        (p as { status?: unknown }).status === 'cancelled',
    );

    // Process approved payment first, then rejected, then the first payment

    const paymentToProcess: any = approvedPayment || rejectedPayment || payments[0];

    if (paymentToProcess) {
      return this.processPaymentWebhook({ data: paymentToProcess });
    }

    this.logger.log(`Merchant order ${merchantOrderId} received but no processable payment found`);
    return { success: true, message: 'No processable payment in merchant order' };
  }

  /**
   * Map Mercado Pago status to our payment status
   */
  mapMercadoPagoStatus(mpStatus: string): string {
    const statusMap: Record<string, string> = {
      approved: 'approved',
      pending: 'pending',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'charged_back',
    };

    return statusMap[mpStatus.toLowerCase()] || 'pending';
  }

  /**
   * Verify payment with Mercado Pago
   */
  async verifyPayment(paymentId: string) {
    this.logger.log(`Verifying payment ${paymentId}`);

    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new BadRequestException('Mercado Pago access token not configured');
    }

    try {
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      const paymentData = await payment.get({ id: paymentId });

      return {
        verified: true,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        payment: paymentData,
      };
    } catch (error: any) {
      this.logger.error(`Error verifying payment ${paymentId}:`, error);
      throw new BadRequestException('No se pudo verificar el pago. Por favor contacta a soporte.');
    }
  }

  /**
   * Process Google Pay payment with Mercado Pago
   */
  async processGooglePayPayment(
    orderId: string,
    token: string,
    amount: number,
    payerEmail: string,
  ) {
    this.logger.log(`Processing Google Pay payment for order ${orderId}`);

    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new BadRequestException('Mercado Pago access token not configured');
    }

    try {
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      const paymentBody = {
        transaction_amount: amount,
        token: token,
        description: `Order ${orderId}`,
        installments: 1,
        payment_method_id: 'googlepay',
        external_reference: orderId,
        payer: {
          email: payerEmail,
        },
      };

      const response = await payment.create({ body: paymentBody });

      this.logger.log(
        `Google Pay payment processed for order ${orderId}. Status: ${response.status}`,
      );

      return {
        id: response.id,
        status: response.status,
        status_detail: response.status_detail,
      };
    } catch (error: any) {
      this.logger.error(`Error processing Google Pay payment for order ${orderId}:`, error);
      throw new BadRequestException(
        'No se pudo procesar el pago. Por favor intenta de nuevo o contacta a soporte.',
      );
    }
  }

  /**
   * Get the webhook secret for signature verification
   */
  getWebhookSecret(): string {
    return this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET')!;
  }

  /**
   * Verify Mercado Pago webhook signature using timing-safe comparison.
   * Docs: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
   */
  verifyWebhookSignature(
    data: unknown,
    signatureHeader: string | undefined,
    requestId: string | undefined,
    secret: string,
    queryParams: Record<string, string>,
  ): boolean {
    try {
      if (!signatureHeader) {
        return false;
      }

      const parts = signatureHeader.split(',');
      const tsMatch = parts.find((p) => p.startsWith('ts='));
      const v1Match = parts.find((p) => p.startsWith('v1='));

      if (!tsMatch || !v1Match) {
        this.logger.warn('Invalid signature header format');
        return false;
      }

      const ts = tsMatch.split('=')[1];
      const receivedHash = v1Match.split('=')[1];

      // Replay protection: reject webhooks older than tolerance window
      const tsSeconds = parseInt(ts, 10);
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (
        isNaN(tsSeconds) ||
        Math.abs(nowSeconds - tsSeconds) > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS
      ) {
        this.logger.warn(`Webhook timestamp out of tolerance window: ts=${ts}, now=${nowSeconds}`);
        return false;
      }

      const dataId =
        queryParams['data.id'] ||
        queryParams.id ||
        ((data as Record<string, unknown>)?.data as Record<string, unknown>)?.id ||
        (data as Record<string, unknown>)?.id;

      if (!dataId) {
        this.logger.warn('No data.id found in webhook');
        return false;
      }

      const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(manifest);
      const calculatedHash = hmac.digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const calculatedBuf = Buffer.from(calculatedHash, 'hex');
      const receivedBuf = Buffer.from(receivedHash, 'hex');

      if (calculatedBuf.length !== receivedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(calculatedBuf, receivedBuf);
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Get public configuration for frontend
   */
  getPublicConfig() {
    return {
      mercadopago: {
        publicKey: this.configService.get<string>('MERCADOPAGO_PUBLIC_KEY'),
      },
      googlePay: {
        merchantId: this.configService.get<string>('GOOGLE_PAY_MERCHANT_ID'),
        merchantName: 'Hydra Collectables',
      },
    };
  }
}
