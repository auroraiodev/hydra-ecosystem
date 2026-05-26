import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@hydra/database';
import { CacheService } from '@hydra/common';
import { CreateOrderDto, ShippingMethod } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { AdminCreateOrderDto } from './dto/admin-create-order.dto.js';
import { CartService } from '../cart/cart.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { Prisma, order_status_enum } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CatalogClient } from '../catalog/catalog.client.js';
import {
  NotifyClientService,
  PurchaseEmailData,
  NotificationType,
} from '../notify-client/notify-client.service.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
    private readonly catalogClient: CatalogClient,
    private readonly notifyClient: NotifyClientService,
    private readonly cacheService: CacheService,
  ) {}

  calculateLocalItemUnitPrice(single: any): number {
    let unitPrice = Number(single.price);
    if (single.conditions && single.conditions.discount) {
      const discountPercent = single.conditions.discount;
      unitPrice = Math.round(unitPrice * (1 - discountPercent / 100) * 100) / 100;
    }
    return unitPrice;
  }

  calculateImportationItemUnitPrice(itemOrProductData: any): number {
    const productData =
      itemOrProductData.product_data || itemOrProductData.productData || itemOrProductData;

    const rawPrice =
      productData?.finalPrice ||
      productData?.price ||
      productData?.unitPrice ||
      productData?.unit_price;

    if (typeof rawPrice === 'number') return rawPrice;
    if (typeof rawPrice === 'string') {
      const clean = rawPrice.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async calculateShippingCost(methodName: string): Promise<number> {
    if (methodName.toUpperCase() !== 'SHIPPING') return 0;
    const setting = await (this.prisma as any).admin_settings.findUnique({
      where: { key: 'shippingCost' },
    });
    return setting ? parseFloat(setting.value) : 280;
  }

  calculateImportFee(): number {
    return 0.0;
  }

  async validateCartStock(userId: string, itemIds?: string[]) {
    const cart = await this.cartService.getOrCreateCart(userId);
    let itemsToValidate = cart.items;

    if (itemIds && itemIds.length > 0) {
      itemsToValidate = cart.items.filter((item) => itemIds.includes(item.id));
    }

    const errors: string[] = [];

    for (const item of itemsToValidate) {
      if (!(item as any).is_importation && (item as any).single_id) {
        const single = await (this.prisma as any).singles.findUnique({
          where: { id: (item as any).single_id },
        });

        if (!single) {
          errors.push(`Product ${(item as any).single_id} not found`);
          continue;
        }

        if (single.stock < item.quantity) {
          errors.push(
            `Sin stock suficiente para ${single.cardName}. Disponible: ${single.stock}, Solicitado: ${item.quantity}`,
          );
        }
      } else if ((item as any).is_importation) {
        const pd = (item as any).product_data;
        const importationStock = typeof pd?.stock === 'number' ? pd.stock : null;
        if (importationStock !== null && item.quantity > importationStock) {
          errors.push(
            `Sin stock suficiente para ${pd?.cardName || pd?.name || 'artículo de importación'}. Disponible: ${importationStock}, Solicitado: ${item.quantity}`,
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Stock validation failed',
        errors,
      });
    }
  }

  async getOrCreateShippingMethod(name: string) {
    let method = await (this.prisma as any).shipping_methods.findUnique({
      where: { name },
    });

    if (!method) {
      method = await (this.prisma as any).shipping_methods.create({
        data: { name },
      });
    }

    return method;
  }

  private async hasActiveOrders(userId: string): Promise<boolean> {
    const count = await (this.prisma as any).orders.count({
      where: {
        user_id: userId,
        status: {
          in: ['PENDING', 'PAID'],
        },
      },
    });
    return count > 0;
  }

  private async enrichOrder(order: any): Promise<any> {
    if (!order) return order;

    let itemsTotal = 0;

    const items = (order.items || []).map((item: any) => {
      const price = Number(item.unit_price) || 0;
      const quantity = item.quantity || 0;
      itemsTotal += price * quantity;

      return {
        id: item.id,
        singleId: item.single_id,
        quantity: item.quantity,
        unitPrice: price,
        isDelivered: item.is_delivered,
        deliveryStatus: item.delivery_status ?? 'pending',
        productData: item.singles
          ? {
              ...item.singles,
              cardName: item.singles.cardName,
              imageUrl: item.singles.img,
              condition:
                item.singles.conditions?.display_name || item.singles.conditions?.name || undefined,
            }
          : undefined,
      };
    });

    const importationItems = (order.importation_items || []).map((item: any) => {
      let unitPrice = Number(item.unit_price) || 0;

      if (unitPrice === 0 && item.product_data) {
        unitPrice = this.calculateImportationItemUnitPrice(item);
      }

      const quantity = item.quantity || 0;
      itemsTotal += unitPrice * quantity;

      return {
        id: item.id,
        importationId: item.importation_id,
        quantity: item.quantity,
        unitPrice: unitPrice,
        isDelivered: item.is_delivered,
        deliveryStatus: item.delivery_status ?? 'pending',
        productData: item.product_data,
      };
    });

    let shippingCost = 0;
    if (order.shipping && order.shipping.shipping_methods) {
      shippingCost = await this.calculateShippingCost(order.shipping.shipping_methods.name);
    }

    let importFee = 0;
    if (order.import_fee !== null && order.import_fee !== undefined) {
      importFee = Number(order.import_fee);
    } else {
      if (importationItems.length > 0 && importFee === 0) {
        importFee = 0;
      }
    }

    const subtotal = itemsTotal + shippingCost + importFee;
    const total = subtotal;

    let shipping: any = undefined;
    if (order.shipping) {
      shipping = {
        id: order.shipping.id,
        shippingMethod: order.shipping.shipping_methods?.name || 'Unknown',
        address: order.shipping.user_addresses
          ? {
              street: order.shipping.user_addresses.street,
              city: order.shipping.user_addresses.city,
              state: order.shipping.user_addresses.state,
              zipCode: order.shipping.user_addresses.zip_code,
              country: order.shipping.user_addresses.country,
              receiverName: order.shipping.user_addresses.receiver_name,
            }
          : {},
      };
    }

    let payment: any = undefined;
    if (order.payments && order.payments.length > 0) {
      const p = order.payments[0];
      payment = {
        id: p.id,
        paymentMethod: p.payment_method,
        mercadopagoPaymentId: p.mercadopago_payment_id,
        mercadopagoPreferenceId: p.mercadopago_preference_id,
        status: p.status,
        paymentData: p.payment_data,
      };
    }

    let walletApplied: number | undefined;
    let remainingToPay: number | undefined;
    let paymentServiceFee: number | undefined;

    if (payment) {
      const isMixedPayment =
        payment.paymentMethod === 'wallet_plus_mercadopago' ||
        payment.paymentMethod === 'wallet_plus_transfer';

      if (isMixedPayment && payment.paymentData) {
        const pd = payment.paymentData as { wallet_amount?: number; remainder?: number };
        walletApplied = pd.wallet_amount;
        remainingToPay = pd.remainder;
      } else if (payment.paymentMethod === 'wallet') {
        walletApplied = total;
        remainingToPay = 0;
      }

      if (payment.paymentData) {
        const pd = payment.paymentData;
        if (Array.isArray(pd.fee_details)) {
          const mpFee = pd.fee_details.find((f: any) => f.type === 'mercadopago_fee');
          if (mpFee) {
            paymentServiceFee = Number(mpFee.amount) || 0;
          }
        }
      }
    }

    return {
      id: order.id,
      userId: order.user_id,
      status: order.status,
      createdAt: order.created_at,
      items,
      importationItems,
      shipping,
      payment,
      total: total.toFixed(2),
      subtotal: itemsTotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      walletApplied: walletApplied !== undefined ? walletApplied.toFixed(2) : undefined,
      remainingToPay: remainingToPay !== undefined ? remainingToPay.toFixed(2) : undefined,
      importFee: importFee > 0 ? importFee.toFixed(2) : undefined,
      paymentServiceFee: paymentServiceFee !== undefined ? paymentServiceFee.toFixed(2) : undefined,
      estimatedDeliveryAt: order.estimated_delivery_at,
      arrivedAt: order.arrived_at,
      deliveredAt: order.delivered_at,
      importOrderedAt: order.import_ordered_at,
      users: order.users,
    };
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    await this.cartService.getCart(userId);

    const existingPending = await (this.prisma as any).orders.findMany({
      where: { user_id: userId, status: 'PENDING' },
      include: { payments: { orderBy: { created_at: 'desc' }, take: 1 } },
    });

    for (const pendingOrder of existingPending) {
      const prevPayment = pendingOrder.payments[0];
      if (
        prevPayment &&
        (prevPayment.payment_method === 'wallet_plus_mercadopago' ||
          prevPayment.payment_method === 'wallet_plus_transfer')
      ) {
        const pd = prevPayment.payment_data as { wallet_amount?: number } | null;
        const walletToRefund = pd?.wallet_amount;
        if (walletToRefund && walletToRefund > 0) {
          await (this.prisma as any).$transaction(async (tx) => {
            await tx.users.update({
              where: { id: userId },
              data: { balance: { increment: walletToRefund } },
            });
            await tx.wallet_transactions.create({
              data: {
                user_id: userId,
                amount: new Prisma.Decimal(walletToRefund),
                type: 'ORDER_REFUND',
                order_id: pendingOrder.id,
                description: `Reembolso automático por nuevo checkout (Pedido ${pendingOrder.id.substring(0, 8)})`,
              },
            });
          });
          this.logger.log(
            `Auto-refunded $${walletToRefund} wallet for replaced pending order ${pendingOrder.id}`,
          );
        }
      }
    }

    const pendingOrderIds = existingPending.map((o) => o.id);

    await this.validateCartStock(userId, createOrderDto.itemIds);

    const cart = await this.cartService.getOrCreateCart(userId);
    let itemsToProcess = cart.items;

    if (createOrderDto.itemIds && createOrderDto.itemIds.length > 0) {
      itemsToProcess = itemsToProcess.filter((item) => createOrderDto.itemIds!.includes(item.id));
      if (itemsToProcess.length === 0) {
        throw new BadRequestException('No items from your selection were found in the cart');
      }
    }

    if (itemsToProcess.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (createOrderDto.shippingMethod === ShippingMethod.SHIPPING && !createOrderDto.addressId) {
      throw new BadRequestException('Address ID is required for shipping method');
    }

    const shippingMethod = await this.getOrCreateShippingMethod(
      createOrderDto.shippingMethod.toUpperCase(),
    );

    const addressId = createOrderDto.addressId;
    if (createOrderDto.shippingMethod === ShippingMethod.SHIPPING) {
      if (!addressId) {
        throw new BadRequestException('Address ID is required');
      }

      const address = await (this.prisma as any).user_addresses.findFirst({
        where: {
          id: addressId,
          user_id: userId,
        },
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }
    }

    const orderId = await (this.prisma as any).$transaction(async (tx) => {
      if (pendingOrderIds.length > 0) {
        await tx.order_items.deleteMany({ where: { order_id: { in: pendingOrderIds } } });
        await tx.order_items_importation.deleteMany({
          where: { order_id: { in: pendingOrderIds } },
        });
        await tx.order_shipping.deleteMany({ where: { order_id: { in: pendingOrderIds } } });
        await tx.payments.deleteMany({ where: { order_id: { in: pendingOrderIds } } });
        await tx.orders.deleteMany({ where: { id: { in: pendingOrderIds } } });
      }

      const newOrder = await tx.orders.create({
        data: {
          user_id: userId,
          status: 'PENDING',
          import_fee: new Prisma.Decimal(0),
        },
      });

      if (createOrderDto.phoneNumber) {
        const cleanPhone = createOrderDto.phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length > 0) {
          await tx.users.update({
            where: { id: userId },
            data: { phone: cleanPhone },
          });
        }
      }

      const localItems = itemsToProcess.filter(
        (item) => !(item as any).is_importation && (item as any).single_id,
      );
      if (localItems.length > 0) {
        for (const cartItem of localItems) {
          const single = await tx.singles.findUnique({
            where: { id: (cartItem as any).single_id! },
            include: { conditions: true },
          });

          if (!single) {
            throw new NotFoundException(`Product ${(cartItem as any).single_id} not found`);
          }

          if (single.stock < cartItem.quantity) {
            throw new BadRequestException(`Insufficient stock for ${single.cardName}`);
          }

          const unitPrice =
            Number((cartItem as any).unit_price) || this.calculateLocalItemUnitPrice(single);

          await tx.order_items.create({
            data: {
              order_id: newOrder.id,
              single_id: single.id,
              quantity: cartItem.quantity,
              unit_price: unitPrice,
            },
          });
        }
      }

      const importationItemsToCreate = itemsToProcess.filter(
        (item) => (item as any).is_importation,
      );
      if (importationItemsToCreate.length > 0) {
        for (const cartItem of importationItemsToCreate) {
          const price =
            Number((cartItem as any).unit_price) ||
            this.calculateImportationItemUnitPrice(cartItem);

          await tx.order_items_importation.create({
            data: {
              order_id: newOrder.id,
              importation_id: (cartItem as any).importation_id || '',
              quantity: cartItem.quantity,
              unit_price: new Prisma.Decimal(price),
              product_data: ((cartItem as any).product_data as Prisma.InputJsonValue) || {},
            },
          });
        }
      }

      if (createOrderDto.shippingMethod === ShippingMethod.SHIPPING && addressId) {
        await tx.order_shipping.create({
          data: {
            order_id: newOrder.id,
            shipping_method_id: shippingMethod.id,
            address_id: addressId,
          },
        });
      }

      return newOrder.id;
    });

    this.logger.log(`Order ${orderId} created for user ${userId}`);

    this.notifyClient.notifyAdmins({
      type: NotificationType.ADMIN_ALERT,
      title: 'Nuevo Pedido Recibido',
      message: `El usuario con ID ${userId} ha creado el pedido #${orderId.substring(0, 8)}.`,
      data: { orderId, userId },
    });

    let paymentResult: {
      paymentId: string;
      preferenceId?: string;
      initPoint?: string;
      paymentMethod?: string;
    } | null = null;

    try {
      this.logger.log(
        `Processing payment for order ${orderId}. Method: ${createOrderDto.paymentMethod}`,
      );

      const method = createOrderDto.paymentMethod.toLowerCase();
      const isMercadoPago = method === 'mercadopago';
      const isWallet = method === 'wallet';

      if (isWallet) {
        await this.payWithWallet(userId, orderId);

        const order = await (this.prisma as any).orders.findUnique({
          where: { id: orderId },
          include: { items: true, importation_items: true, payments: true },
        });
        const enriched = await this.enrichOrder(order);

        return {
          order: enriched,
          payment: {
            paymentId: enriched.payment?.id,
            paymentMethod: 'wallet',
          },
        };
      } else if (isMercadoPago) {
        const orderWithItems = await (this.prisma as any).orders.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                singles: true,
              },
            },
            importation_items: true,
          },
        });

        if (!orderWithItems) {
          throw new NotFoundException(`Order ${orderId} not found`);
        }

        const mpItems: Array<{
          title: string;
          quantity: number;
          unit_price: number;
        }> = [];

        for (const item of orderWithItems.items) {
          const single = item.singles;
          const title =
            (single?.cardName as string | null | undefined) || single?.cardName || 'Producto';
          const quantity = item.quantity;
          const unitPrice = Math.round(parseFloat(item.unit_price.toString()) * 100) / 100;
          if (unitPrice > 0) {
            mpItems.push({ title, quantity, unit_price: unitPrice });
          }
        }

        for (const item of orderWithItems.importation_items) {
          const productData = item.product_data as
            | { cardName?: string; name?: string; [key: string]: unknown }
            | null
            | undefined;
          const title = productData?.cardName || productData?.name || 'Producto';
          const quantity = item.quantity;
          const unitPrice = Math.round(parseFloat(item.unit_price.toString()) * 100) / 100;
          if (unitPrice > 0) {
            mpItems.push({ title, quantity, unit_price: unitPrice });
          }
        }

        let importFeeAmount = 0;
        if (orderWithItems.import_fee !== null && orderWithItems.import_fee !== undefined) {
          importFeeAmount = Number(orderWithItems.import_fee);
        }

        if (importFeeAmount > 0) {
          mpItems.push({
            title: 'Tarifa de Importación',
            quantity: 1,
            unit_price: importFeeAmount,
          });
        }

        const finalShippingCost = await this.calculateShippingCost(createOrderDto.shippingMethod);

        if (finalShippingCost > 0) {
          mpItems.push({
            title: 'Envío Express',
            quantity: 1,
            unit_price: finalShippingCost,
          });
        }

        const total = mpItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

        const MP_MINIMUM_AMOUNT = 50;
        if (total < MP_MINIMUM_AMOUNT) {
          throw new BadRequestException(
            `El monto mínimo para pagar con Mercado Pago es de $${MP_MINIMUM_AMOUNT} MXN`,
          );
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

        let baseUrl = frontendUrl.split(',')[0].trim();

        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            baseUrl = `http://${baseUrl}`;
          } else {
            baseUrl = `https://${baseUrl}`;
          }
        }

        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }

        try {
          new URL(baseUrl);
          this.logger.log(`Using validated Base URL for MP Preference: ${baseUrl}`);
        } catch (error) {
          this.logger.error(`Invalid FRONTEND_URL: ${baseUrl}`, error);
          throw new BadRequestException(
            `Invalid FRONTEND_URL configuration: ${baseUrl}. Must be a valid URL with protocol (http:// or https://)`,
          );
        }

        const user = await (this.prisma as any).users.findUnique({
          where: { id: userId },
          select: { email: true, first_name: true, last_name: true },
        });

        const preference = await this.paymentsService.createMercadoPagoPreference(
          orderId,
          mpItems,
          {
            success: `${baseUrl}/profile/orders/${orderId}?status=success`,
            failure: `${baseUrl}/profile/orders/${orderId}?status=failure`,
            pending: `${baseUrl}/profile/orders/${orderId}?status=pending`,
          },
          user
            ? {
                email: user.email,
                name: user.first_name,
                surname: user.last_name,
              }
            : undefined,
        );

        const payment = await this.paymentsService.createPayment(
          orderId,
          'mercadopago',
          preference.preference_id,
          { preference },
        );

        paymentResult = {
          paymentId: payment.id,
          preferenceId: preference.preference_id,
          initPoint: preference.init_point,
        };
      } else if (method === 'transfer') {
        const payment = await this.paymentsService.createPayment(orderId, 'transfer');

        const itemIdsToRemove = itemsToProcess.map((item) => item.id);
        await (this.prisma as any).cart_items.deleteMany({
          where: {
            id: { in: itemIdsToRemove },
            cart_id: cart.id,
          },
        });

        this.logger.log(
          `Order ${orderId}: cleared ${itemIdsToRemove.length} selected items from cart for transfer payment`,
        );
        paymentResult = {
          paymentId: payment.id,
          paymentMethod: 'transfer',
        };
      } else if (method === 'googlepay') {
        if (!createOrderDto.paymentToken) {
          throw new BadRequestException('Payment token is required for Google Pay');
        }

        const user = await (this.prisma as any).users.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        const orderWithItems = await this.getOrder(orderId, userId);
        const totalAmount = parseFloat(orderWithItems.total);

        const gpPayment = await this.paymentsService.processGooglePayPayment(
          orderId,
          createOrderDto.paymentToken,
          totalAmount,
          user?.email || '',
        );

        const payment = await this.paymentsService.createPayment(
          orderId,
          'googlepay',
          gpPayment.id?.toString(),
          gpPayment,
        );

        const paymentStatus = this.paymentsService.mapMercadoPagoStatus(
          gpPayment.status || 'pending',
        );
        await this.paymentsService.updatePayment(
          payment.id,
          gpPayment.id?.toString() || '',
          gpPayment,
          paymentStatus,
        );

        if (paymentStatus === 'approved') {
          await this.handleOrderPaymentUpdate(orderId, 'PAID');
        }

        paymentResult = {
          paymentId: payment.id,
          paymentMethod: 'googlepay',
        };
      } else if (method === 'wallet_plus_mercadopago') {
        const walletAmount = createOrderDto.walletAmount;
        if (!walletAmount || walletAmount <= 0) {
          throw new BadRequestException('Se debe especificar un monto válido de saldo a favor');
        }

        const orderForCalc = await (this.prisma as any).orders.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { singles: true } },
            importation_items: true,
            shipping: { include: { shipping_methods: true } },
          },
        });
        const enrichedCalc = await this.enrichOrder(orderForCalc);
        const total = parseFloat(enrichedCalc.total);

        if (walletAmount >= total) {
          throw new BadRequestException(
            'El saldo a favor debe ser menor al total. Use pago con saldo completo en su lugar.',
          );
        }

        const remainder = Math.round((total - walletAmount) * 100) / 100;
        const MP_MINIMUM_AMOUNT = 50;
        if (remainder < MP_MINIMUM_AMOUNT) {
          throw new BadRequestException(
            `El monto restante para pagar con tarjeta ($${remainder.toFixed(2)} MXN) es menor al mínimo de Mercado Pago ($${MP_MINIMUM_AMOUNT} MXN). Por favor reduce el saldo a aplicar.`,
          );
        }

        const userWallet = await (this.prisma as any).users.findUnique({ where: { id: userId } });
        if (!userWallet || Number(userWallet.balance) < walletAmount) {
          throw new BadRequestException('Saldo insuficiente en tu wallet.');
        }

        const frontendUrlMixed = this.configService.get<string>(
          'FRONTEND_URL',
          'http://localhost:3000',
        );
        let baseUrlMixed = frontendUrlMixed.split(',')[0].trim();
        if (!baseUrlMixed.startsWith('http://') && !baseUrlMixed.startsWith('https://')) {
          baseUrlMixed =
            baseUrlMixed.includes('localhost') || baseUrlMixed.includes('127.0.0.1')
              ? `http://${baseUrlMixed}`
              : `https://${baseUrlMixed}`;
        }
        if (baseUrlMixed.endsWith('/')) baseUrlMixed = baseUrlMixed.slice(0, -1);

        const userMixed = await (this.prisma as any).users.findUnique({
          where: { id: userId },
          select: { email: true, first_name: true, last_name: true },
        });

        const mpItemsMixed = [
          {
            title: `Orden #${orderId.slice(-8)} (pago con tarjeta)`,
            quantity: 1,
            unit_price: remainder,
          },
        ];

        const preferenceMixed = await this.paymentsService.createMercadoPagoPreference(
          orderId,
          mpItemsMixed,
          {
            success: `${baseUrlMixed}/orders/${orderId}?status=success`,
            failure: `${baseUrlMixed}/orders/${orderId}?status=failure`,
            pending: `${baseUrlMixed}/orders/${orderId}?status=pending`,
          },
          userMixed
            ? {
                email: userMixed.email,
                name: userMixed.first_name,
                surname: userMixed.last_name,
              }
            : undefined,
        );

        const paymentMixed = await (this.prisma as any).$transaction(async (tx) => {
          await tx.users.update({
            where: { id: userId },
            data: { balance: { decrement: walletAmount } },
          });
          await tx.wallet_transactions.create({
            data: {
              user_id: userId,
              amount: new Prisma.Decimal(-walletAmount),
              type: 'PURCHASE',
              order_id: orderId,
              description: `Saldo aplicado a orden (Pedido ${orderId.substring(0, 8)})`,
            },
          });
          return tx.payments.create({
            data: {
              order_id: orderId,
              payment_method: 'wallet_plus_mercadopago',
              mercadopago_preference_id: preferenceMixed.preference_id,
              status: 'pending',
              payment_data: {
                wallet_amount: walletAmount,
                remainder,
                preference: preferenceMixed,
              } as any,
            },
          });
        });

        paymentResult = {
          paymentId: paymentMixed.id,
          preferenceId: preferenceMixed.preference_id,
          initPoint: preferenceMixed.init_point,
          paymentMethod: 'wallet_plus_mercadopago',
        };
      } else if (method === 'wallet_plus_transfer') {
        const walletAmount = createOrderDto.walletAmount;
        if (!walletAmount || walletAmount <= 0) {
          throw new BadRequestException('Se debe especificar un monto válido de saldo a favor');
        }

        const orderForCalcT = await this.prisma.orders.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { singles: true } },
            importation_items: true,
            shipping: { include: { shipping_methods: true } },
          },
        });
        const enrichedCalcT = await this.enrichOrder(orderForCalcT);
        const totalT = parseFloat(enrichedCalcT.total);

        if (walletAmount >= totalT) {
          throw new BadRequestException(
            'El saldo a favor debe ser menor al total. Use pago con saldo completo en su lugar.',
          );
        }

        const remainderT = Math.round((totalT - walletAmount) * 100) / 100;

        const userWalletT = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!userWalletT || Number(userWalletT.balance) < walletAmount) {
          throw new BadRequestException('Saldo insuficiente en tu wallet.');
        }

        const paymentTransfer = await (this.prisma as any).$transaction(async (tx) => {
          await tx.users.update({
            where: { id: userId },
            data: { balance: { decrement: walletAmount } },
          });
          await tx.wallet_transactions.create({
            data: {
              user_id: userId,
              amount: new Prisma.Decimal(-walletAmount),
              type: 'PURCHASE',
              order_id: orderId,
              description: `Saldo aplicado a orden (Pedido ${orderId.substring(0, 8)})`,
            },
          });
          return tx.payments.create({
            data: {
              order_id: orderId,
              payment_method: 'wallet_plus_transfer',
              status: 'pending',
              payment_data: { wallet_amount: walletAmount, remainder: remainderT } as any,
            },
          });
        });

        await this.cartService.clearCart(userId);

        paymentResult = {
          paymentId: paymentTransfer.id,
          paymentMethod: 'wallet_plus_transfer',
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to process payment for order ${orderId}. Rolling back. Error: ${error}`,
      );
      try {
        const failedPayment = await (this.prisma as any).payments.findFirst({
          where: { order_id: orderId },
          orderBy: { created_at: 'desc' },
        });
        const isMixed =
          failedPayment?.payment_method === 'wallet_plus_mercadopago' ||
          failedPayment?.payment_method === 'wallet_plus_transfer';
        if (isMixed && failedPayment?.payment_data) {
          const pd = failedPayment.payment_data as { wallet_amount?: number };
          const walletToRefund = pd.wallet_amount;
          if (walletToRefund && walletToRefund > 0) {
            await (this.prisma as any).$transaction(async (tx) => {
              await tx.users.update({
                where: { id: userId },
                data: { balance: { increment: walletToRefund } },
              });
              await tx.wallet_transactions.create({
                data: {
                  user_id: userId,
                  amount: new Prisma.Decimal(walletToRefund),
                  type: 'ORDER_REFUND',
                  order_id: orderId,
                  description: `Reembolso por error en checkout (Pedido ${orderId.substring(0, 8)})`,
                },
              });
            });
            this.logger.log(
              `Rolled back wallet $${walletToRefund} for failed checkout on order ${orderId}`,
            );
          }
        }
      } catch (refundError) {
        this.logger.error(
          `CRITICAL: Failed to refund wallet for order ${orderId} during rollback: ${refundError}`,
        );
      }
      await this.deleteOrder(orderId, userId);
      throw error;
    }

    const fullOrder = await this.getOrder(orderId, userId);

    try {
      if (fullOrder.users) {
        const emailData: PurchaseEmailData = {
          orderId: fullOrder.id,
          customerName:
            `${fullOrder.users.first_name || ''} ${fullOrder.users.last_name || ''}`.trim() ||
            fullOrder.users.username ||
            'Cliente',
          customerEmail: fullOrder.users.email,
          totalAmount: `$${fullOrder.total}`,
          paymentMethod: createOrderDto.paymentMethod,
          items: [
            ...(fullOrder.items || []).map((item: any) => ({
              name: item.productData?.cardName || item.productData?.name || 'Producto',
              quantity: item.quantity,
              price: `$${Number(item.unitPrice).toFixed(2)}`,
            })),
            ...(fullOrder.importationItems || []).map((item: any) => ({
              name: item.productData?.cardName || item.productData?.name || 'Producto Importation',
              quantity: item.quantity,
              price: `$${Number(item.unitPrice).toFixed(2)}`,
            })),
          ],
        };

        if (createOrderDto.shippingMethod === ShippingMethod.SHIPPING) {
          const emailShippingCost = await this.calculateShippingCost(ShippingMethod.SHIPPING);
          emailData.items.push({
            name: 'Envío Express',
            quantity: 1,
            price: `$${emailShippingCost.toFixed(2)}`,
          });
          emailData.shippingMethod = 'Envío a domicilio';
        } else {
          emailData.shippingMethod = 'Acordar con vendedor';
        }

        if (fullOrder.importFee) {
          emailData.items.push({
            name: 'Tarifa de Importación',
            quantity: 1,
            price: `$${fullOrder.importFee}`,
          });
        }

        if (fullOrder.paymentServiceFee) {
          emailData.items.push({
            name: 'Comisión de Servicio',
            quantity: 1,
            price: `$${fullOrder.paymentServiceFee}`,
          });
        }

        if (fullOrder.status !== 'PAID' && fullOrder.status !== 'approved') {
          await Promise.all([
            this.notifyClient.sendPurchaseNotification(emailData),
            this.notifyClient.sendCustomerConfirmation(emailData),
          ]);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send email notification for order ${orderId}: ${error}`);
    }

    return {
      order: fullOrder,
      payment: paymentResult,
    };
  }

  async getOrder(orderId: string, userId: string) {
    const order = await (this.prisma as any).orders.findFirst({
      where: {
        id: orderId,
        user_id: userId,
      },
      include: {
        items: {
          include: {
            singles: {
              include: {
                categories: true,
                conditions: true,
                languages: true,
                tcgs: true,
                owner: {
                  include: {
                    roles: true,
                  },
                },
              },
            },
          },
        },
        importation_items: true,
        shipping: {
          include: {
            shipping_methods: true,
            user_addresses: true,
          },
        },
        payments: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return await this.enrichOrder(order);
  }

  async getUserOrders(userId: string) {
    const orders = await (this.prisma as any).orders.findMany({
      where: {
        user_id: userId,
      },
      include: {
        users: true,
        items: {
          include: {
            singles: {
              include: {
                categories: true,
                conditions: true,
                languages: true,
              },
            },
          },
        },
        importation_items: true,
        shipping: {
          include: {
            shipping_methods: true,
            user_addresses: true,
          },
        },
        payments: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const statusPriority: Record<string, number> = {
      PENDING: 0,
      PAID: 1,
      PROCESSING: 2,
      SHIPPED: 3,
      COMPLETED: 4,
      CANCELLED: 5,
    };

    const enriched = await Promise.all(orders.map((order) => this.enrichOrder(order)));
    enriched.sort((a, b) => {
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return enriched;
  }

  async getAllOrders(page = 1, limit = 10, search?: string, status?: string, userId?: string) {
    this.logger.log(
      `getAllOrders: Fetching all orders (page: ${page}, limit: ${limit}, search: ${search}, status: ${status}, userId: ${userId})...`,
    );

    const skip = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [];
    if (status) {
      conditions.push(Prisma.sql`o.status::text = ${status.toUpperCase()}`);
    }
    if (userId) {
      conditions.push(Prisma.sql`o.user_id = ${userId}::uuid`);
    }
    if (search) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
      const searchLike = `%${search}%`;
      const searchParts: Prisma.Sql[] = [
        Prisma.sql`o.notes ILIKE ${searchLike}`,
        Prisma.sql`u.email ILIKE ${searchLike}`,
        Prisma.sql`u.first_name ILIKE ${searchLike}`,
        Prisma.sql`u.last_name ILIKE ${searchLike}`,
        Prisma.sql`u.username ILIKE ${searchLike}`,
      ];
      if (isUuid) searchParts.unshift(Prisma.sql`o.id = ${search}`);
      conditions.push(Prisma.sql`(${Prisma.join(searchParts, ' OR ')})`);
    }
    const whereClause =
      conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

    const [orderedRows, countResult] = await Promise.all([
      (this.prisma as any).$queryRaw<{ id: string }[]>`
        SELECT o.id FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY
          CASE o.status
            WHEN 'PENDING'    THEN 0
            WHEN 'PAID'       THEN 1
            WHEN 'PROCESSING' THEN 2
            WHEN 'SHIPPED'    THEN 3
            WHEN 'COMPLETED'  THEN 4
            WHEN 'CANCELLED'  THEN 5
            ELSE 99
          END ASC,
          o.created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      (this.prisma as any).$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
      `,
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const orderedIds = orderedRows.map((r) => r.id);

    const ordersById = await (this.prisma as any).orders.findMany({
      where: { id: { in: orderedIds } },
      include: {
        users: true,
        items: {
          include: {
            singles: {
              include: {
                categories: true,
                conditions: true,
                languages: true,
                tcgs: true,
                owner: {
                  include: {
                    roles: true,
                  },
                },
              },
            },
          },
        },
        importation_items: true,
        shipping: {
          include: {
            shipping_methods: true,
            user_addresses: true,
          },
        },
        payments: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    const ordersMap = new Map(ordersById.map((o) => [o.id, o]));
    const orders = orderedIds.map((id) => ordersMap.get(id)).filter(Boolean);

    this.logger.log(
      `getAllOrders: Found ${orders.length} orders (Total: ${total}). IDs: ${orders.map((o) => o!.id).join(', ')}`,
    );

    const data = await Promise.all(orders.map((order) => this.enrichOrder(order)));
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string) {
    this.logger.log(`getOrderById: Fetching order ${orderId}`);
    const order = await (this.prisma as any).orders.findUnique({
      where: {
        id: orderId,
      },
      include: {
        users: true,
        items: {
          include: {
            singles: {
              include: {
                categories: true,
                conditions: true,
                languages: true,
                tcgs: true,
                owner: {
                  include: {
                    roles: true,
                  },
                },
              },
            },
          },
        },
        importation_items: true,
        shipping: {
          include: {
            shipping_methods: true,
            user_addresses: true,
          },
        },
        payments: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      this.logger.error(`getOrderById: Order ${orderId} NOT FOUND in DB`);
      const check = await (this.prisma as any).orders.findFirst({ where: { id: orderId } });
      this.logger.error(
        `getOrderById: Double check with findFirst result: ${check ? 'FOUND' : 'NOT FOUND'}`,
      );

      throw new NotFoundException('Order not found');
    }

    return await this.enrichOrder(order);
  }

  async updateOrderStatus(orderId: string, status: string, userId?: string) {
    const where: Prisma.ordersWhereUniqueInput = userId
      ? { id: orderId, user_id: userId }
      : { id: orderId };

    const order = await (this.prisma as any).orders.findUnique({
      where,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await (this.prisma as any).orders.update({
      where: { id: orderId },
      data: { status: status as order_status_enum },
      include: {
        items: {
          include: {
            singles: true,
          },
        },
        importation_items: true,
        shipping: {
          include: {
            shipping_methods: true,
          },
        },
        users: true,
      },
    });

    if (order.status === 'PENDING' && status === 'PAID') {
      await (this.prisma as any).$transaction(async (tx) => {
        await this.finalizePaidOrder(orderId, tx);
      });
      await this.cacheService.invalidateHomePage();
      this.logger.log(`Order ${orderId} finalized after manual status update to PAID`);
      await this.sendOrderCompletionEmails(orderId);
    }

    const statusLabels: Record<string, string> = {
      PENDING: 'Pendiente',
      PAID: 'Pagado',
      PROCESSING: 'En proceso',
      SHIPPED: 'Enviado',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };

    const statusMessages: Record<string, string> = {
      PENDING: 'Tu pedido está pendiente de confirmación de pago.',
      PAID: 'Hemos recibido tu pago correctamente. ¡Estamos preparando tus cartas!',
      PROCESSING: 'Tu pedido ya está siendo procesado por nuestro equipo.',
      SHIPPED: '¡Buenas noticias! Tu pedido ha sido enviado y está en camino.',
      COMPLETED: 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!',
      CANCELLED: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
    };

    const friendlyStatus = statusLabels[status] || status;
    const infoMessage =
      statusMessages[status] ||
      `Tu pedido #${updatedOrder.id.substring(0, 8)} ha cambiado a estado: ${friendlyStatus}`;

    await this.notifyClient.createNotification({
      userId: updatedOrder.user_id,
      type: NotificationType.ORDER_STATUS,
      title: `Pedido ${friendlyStatus}`,
      message: infoMessage,
      data: { orderId: updatedOrder.id, status: updatedOrder.status },
    });

    return await this.enrichOrder(updatedOrder);
  }

  async removeOrderItems(orderId: string, itemIds: string[], userId: string, userRole: string) {
    const order = await (this.prisma as any).orders.findFirst({
      where: { id: orderId },
      include: { items: true, importation_items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SELLER';
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can remove items from orders');
    }

    const shouldRestoreStock = order.status !== 'PENDING';

    await (this.prisma as any).$transaction(async (tx) => {
      for (const itemId of itemIds) {
        const localItem = order.items.find((i) => i.id === itemId);
        if (localItem) {
          if (shouldRestoreStock && localItem.single_id) {
            await tx.singles.update({
              where: { id: localItem.single_id },
              data: { stock: { increment: localItem.quantity } },
            });
          }
          await tx.order_items.delete({ where: { id: itemId } });
          continue;
        }

        const importationItem = order.importation_items.find((i) => i.id === itemId);
        if (importationItem) {
          await tx.order_items_importation.delete({ where: { id: itemId } });
          continue;
        }

        this.logger.warn(`Item ${itemId} not found in order ${orderId} during removal.`);
      }
    });

    const updatedOrder = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: { items: true, importation_items: true },
    });

    if (
      updatedOrder &&
      updatedOrder.items.length === 0 &&
      updatedOrder.importation_items.length === 0
    ) {
      this.logger.log(`Order ${orderId} is now empty after item removal. Deleting order.`);
      await this.deleteOrderById(orderId);
      return { id: orderId, deleted: true } as any;
    }

    if (isAdmin) {
      return this.getOrderById(orderId);
    } else {
      return this.getOrder(orderId, userId);
    }
  }

  private buildStatusNotification(
    itemLabel: string,
    orderRef: string,
    status: string,
  ): { title: string; message: string } {
    switch (status) {
      case 'importing':
        return {
          title: '📦 Pedido en Importación',
          message: `Tu carta "${itemLabel}" del pedido #${orderRef} ha sido ordenada y está en camino a México. Te avisaremos cuando llegue.`,
        };
      case 'ready':
        return {
          title: '🎉 ¡Lista para Entrega!',
          message: `¡Buenas noticias! Tu carta "${itemLabel}" del pedido #${orderRef} ya llegó a México y está lista para ser enviada o recogida.`,
        };
      case 'sold':
        return {
          title: '✅ Carta Entregada',
          message: `Tu carta "${itemLabel}" del pedido #${orderRef} ha sido entregada exitosamente. ¡Gracias por tu compra!`,
        };
      case 'cancelled':
        return {
          title: '❌ Carta Cancelada',
          message: `Tu carta "${itemLabel}" del pedido #${orderRef} ha sido cancelada.`,
        };
      default:
        return {
          title: 'Estado Actualizado',
          message: `El estado de tu carta "${itemLabel}" del pedido #${orderRef} ha sido actualizado a: ${status}.`,
        };
    }
  }

  private buildOrderStatusNotification(
    orderRef: string,
    status: string,
  ): { title: string; message: string } {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PAID':
        return {
          title: '💰 Pago Confirmado',
          message: `Hemos recibido el pago de tu pedido #${orderRef}. ¡Pronto comenzaremos a procesarlo!`,
        };
      case 'PROCESSING':
        return {
          title: '⚙️ Pedido en Proceso',
          message: `Tu pedido #${orderRef} ahora está en proceso. Estamos preparando tus artículos.`,
        };
      case 'SHIPPED':
        return {
          title: '🚚 Pedido Enviado',
          message: `¡Tu pedido #${orderRef} ha sido enviado! Revisa los detalles de seguimiento en tu perfil.`,
        };
      case 'COMPLETED':
        return {
          title: '✅ Pedido Completado',
          message: `Tu pedido #${orderRef} ha sido marcado como completado. ¡Esperamos que disfrutes tus cartas!`,
        };
      case 'CANCELLED':
        return {
          title: '❌ Pedido Cancelado',
          message: `Tu pedido #${orderRef} ha sido cancelada. Si crees que esto es un error, contáctanos.`,
        };
      case 'IN_TRANSIT':
        return {
          title: '✈️ Pedido en Camino a México',
          message: `Tu pedido #${orderRef} ya está viajando hacia México. ¡Pronto estará aquí!`,
        };
      case 'IN_MEXICO':
        return {
          title: '📦 Pedido en México',
          message: `Tu pedido #${orderRef} ya se encuentra en México y está siendo procesado para importación.`,
        };
      default:
        return {
          title: 'Pedido Actualizado',
          message: `El estado de tu pedido #${orderRef} ha cambiado a: ${status}.`,
        };
    }
  }

  async updateItemDeliveryStatus(
    orderId: string,
    itemId: string,
    dto: { isDelivered?: boolean; deliveredQuantity?: number; status?: string },
    userRole: string,
  ) {
    this.logger.log(
      `updateItemDeliveryStatus: Order ${orderId}, Item ${itemId}, DTO: ${JSON.stringify(dto)}`,
    );
    const isAdmin = userRole === 'ADMIN' || userRole === 'SELLER';
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update item delivery status');
    }

    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            singles: true,
          },
        },
        importation_items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const localItem = order.items.find((i) => i.id === itemId);
    if (localItem) {
      await (this.prisma as any).$transaction(async (tx) => {
        if (dto.status) {
          const newStatus = dto.status.toLowerCase();
          const isSold = newStatus === 'sold';
          const isImporting = newStatus === 'importing';

          await tx.order_items.update({
            where: { id: itemId },
            data: {
              delivery_status: newStatus,
              is_delivered: isSold,
              ...(isSold && { delivered_quantity: localItem.quantity }),
            },
          });

          if (isImporting && !order.import_ordered_at) {
            await tx.orders.update({
              where: { id: orderId },
              data: { import_ordered_at: new Date() },
            });
          }

          if (isSold && !localItem.is_delivered) {
            const remaining = localItem.quantity - (localItem.delivered_quantity ?? 0);
            if (remaining > 0) {
              await this.processOrderItemFinalization(orderId, itemId, tx, remaining);
            }
          }
          return;
        }

        if (dto.deliveredQuantity !== undefined && dto.deliveredQuantity > 0) {
          const newDeliveredQty = Math.min(
            (localItem.delivered_quantity ?? 0) + dto.deliveredQuantity,
            localItem.quantity,
          );
          const fullyDelivered = newDeliveredQty >= localItem.quantity;
          await tx.order_items.update({
            where: { id: itemId },
            data: {
              delivered_quantity: newDeliveredQty,
              is_delivered: fullyDelivered,
              delivery_status: fullyDelivered ? 'sold' : 'partial',
            },
          });
          if (fullyDelivered) {
            const remaining = localItem.quantity - (localItem.delivered_quantity ?? 0);
            if (remaining > 0) {
              await this.processOrderItemFinalization(orderId, itemId, tx, remaining);
            }
          }
        } else if (dto.isDelivered === false) {
          await tx.order_items.update({
            where: { id: itemId },
            data: { is_delivered: false, delivered_quantity: 0, delivery_status: 'pending' },
          });
        } else if (dto.isDelivered === true) {
          const remaining = localItem.quantity - (localItem.delivered_quantity ?? 0);
          await tx.order_items.update({
            where: { id: itemId },
            data: {
              is_delivered: true,
              delivered_quantity: localItem.quantity,
              delivery_status: 'sold',
            },
          });
          if (remaining > 0) {
            await this.processOrderItemFinalization(orderId, itemId, tx, remaining);
          }
        }
      });
      await this.cacheService.invalidateHomePage();

      const itemLabel = localItem.singles?.cardName || 'Carta';
      const orderRef = orderId.substring(0, 8).toUpperCase();
      const finalStatus = dto.status?.toLowerCase() || (dto.isDelivered ? 'sold' : 'pending');
      const { title: notifTitle, message: notifMessage } = this.buildStatusNotification(
        itemLabel,
        orderRef,
        finalStatus,
      );

      await this.notifyClient.createNotification({
        userId: order.user_id,
        type: NotificationType.ITEM_DELIVERY,
        title: notifTitle,
        message: notifMessage,
        data: { orderId, itemId, status: finalStatus },
      });

      return this.getOrderById(orderId);
    }

    const importationItem = order.importation_items.find((i) => i.id === itemId);
    if (importationItem) {
      if (dto.status) {
        const newStatus = dto.status.toLowerCase();
        const isImporting = newStatus === 'importing';

        await (this.prisma as any).order_items_importation.update({
          where: { id: itemId },
          data: {
            delivery_status: newStatus,
            is_delivered: newStatus === 'sold',
          },
        });

        if (isImporting && !order.import_ordered_at) {
          await (this.prisma as any).orders.update({
            where: { id: orderId },
            data: { import_ordered_at: new Date() },
          });
        }
      } else if (dto.deliveredQuantity !== undefined && dto.deliveredQuantity > 0) {
        const newDeliveredQty = Math.min(
          (importationItem.delivered_quantity ?? 0) + dto.deliveredQuantity,
          importationItem.quantity,
        );
        const fullyDelivered = newDeliveredQty >= importationItem.quantity;
        await (this.prisma as any).order_items_importation.update({
          where: { id: itemId },
          data: {
            delivered_quantity: newDeliveredQty,
            is_delivered: fullyDelivered,
            delivery_status: fullyDelivered ? 'sold' : 'partial',
          },
        });
      } else if (dto.isDelivered === false) {
        await (this.prisma as any).order_items_importation.update({
          where: { id: itemId },
          data: { is_delivered: false, delivered_quantity: 0, delivery_status: 'pending' },
        });
      } else if (dto.isDelivered === true) {
        await (this.prisma as any).order_items_importation.update({
          where: { id: itemId },
          data: {
            is_delivered: true,
            delivered_quantity: importationItem.quantity,
            delivery_status: 'sold',
          },
        });
      }

      const pd = importationItem.product_data as Record<string, unknown>;
      const importationLabel = String(pd?.cardName || pd?.name || 'Carta Importada');
      const importationRef = orderId.substring(0, 8).toUpperCase();
      const importationFinalStatus =
        dto.status?.toLowerCase() || (dto.isDelivered ? 'sold' : 'pending');
      const { title: importationTitle, message: importationMessage } = this.buildStatusNotification(
        importationLabel,
        importationRef,
        importationFinalStatus,
      );

      await this.notifyClient.createNotification({
        userId: order.user_id,
        type: NotificationType.ITEM_DELIVERY,
        title: importationTitle,
        message: importationMessage,
        data: { orderId, itemId, status: importationFinalStatus },
      });

      return this.getOrderById(orderId);
    }

    throw new NotFoundException(`Item ${itemId} not found in order ${orderId}`);
  }

  async addOrderItem(orderId: string, dto: any) {
    const { singleId, quantity, isImportation } = dto;

    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (isImportation) {
      const pricingResult = await this.catalogClient.getImportationPricing({
        productIds: [singleId],
        cardNames: dto.cardName ? [dto.cardName] : undefined,
      });

      let productInfo: any;

      if (pricingResult.success && pricingResult.pricing && pricingResult.pricing.length > 0) {
        const requestedLang = this.mapLanguageToSpanish(dto.productData?.language);
        const requestedFoil = !!dto.productData?.foil;

        productInfo = pricingResult.pricing.find((p) => {
          const pLang = this.mapLanguageToSpanish(p.language);
          const pFoil = !!p.isFoil;
          return pLang === requestedLang && pFoil === requestedFoil;
        });

        if (!productInfo) {
          this.logger.warn(
            `Strict variant match failed for ${singleId}. Looking for: ${requestedLang} Foil: ${requestedFoil}. Available variants: ${pricingResult.pricing.map((p) => `${this.mapLanguageToSpanish(p.language)} (Foil: ${p.isFoil})`).join(', ')}`,
          );
        } else {
          const isLocal =
            !!dto.productData?.isLocalInventory || !!dto.productData?.immediateDelivery;
          const freshPrice = isLocal
            ? productInfo.price_mxn_local
            : productInfo.price_mxn_importation;

          if (freshPrice) {
            productInfo.price = freshPrice;
            productInfo.currency = 'MXN';
          }
        }
      }

      if (!productInfo && dto.productData) {
        this.logger.warn(
          `Importation search/match failed for ${singleId}, using provided productData fallback.`,
        );
        productInfo = {
          productId: dto.productData.importationId || singleId,
          name: dto.productData.name || dto.productData.cardName || 'Unknown Product',
          title: dto.productData.title || dto.productData.name || 'Unknown Product',
          price: Number(dto.productData.price) || 0,
          currency: 'MXN',
          stock: 999,
          condition: 'NM',
          language: dto.productData.language || 'English',
          imageUrl: dto.productData.imageUrl || dto.productData.img,
          url: dto.productData.url || '',
          isFoil: dto.productData.foil || false,
          description: dto.productData.description || '',
        } as any;
      }

      if (!productInfo) {
        this.logger.error('Importation lookup failed and no fallback productData provided.');
        throw new BadRequestException('Failed to fetch Importation product details');
      }

      if (!dto.productData && productInfo.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock at Importation. Available: ${productInfo.stock}, Requested: ${quantity}`,
        );
      }

      await (this.prisma as any).order_items_importation.create({
        data: {
          order_id: orderId,
          importation_id: singleId,
          quantity: quantity,
          unit_price: productInfo.price || dto.productData?.price || 0,
          product_data: {
            foil: productInfo.isFoil || dto.productData?.foil || false,
            name:
              productInfo.name ||
              productInfo.cardName ||
              dto.productData?.name ||
              dto.productData?.cardName,
            price: `$${(productInfo.price || dto.productData?.price || 0).toFixed(2)} MXN`,
            cardName:
              productInfo.name ||
              productInfo.cardName ||
              dto.productData?.name ||
              dto.productData?.cardName,
            imageUrl: productInfo.imageUrl || dto.productData?.imageUrl || dto.productData?.img,
            language: this.mapLanguageToSpanish(productInfo.language || dto.productData?.language),
            importationId: String(singleId),
            condition: productInfo.condition || dto.productData?.condition || 'Near Mint',
            url: productInfo.url || dto.productData?.url,
          },
        },
      });
    } else {
      await (this.prisma as any).$transaction(async (tx) => {
        const single = await tx.singles.findUnique({
          where: { id: singleId },
          include: { conditions: true },
        });

        if (!single) {
          throw new NotFoundException('Product not found');
        }

        if (single.stock < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${single.stock}, Requested: ${quantity}`,
          );
        }

        let unitPrice = Number(single.price);
        if (single.conditions && single.conditions.discount) {
          const discountPercent = single.conditions.discount;
          unitPrice = Math.round(unitPrice * (1 - discountPercent / 100) * 100) / 100;
        }

        const newItem = await tx.order_items.create({
          data: {
            order_id: orderId,
            single_id: singleId,
            quantity: quantity,
            unit_price: unitPrice,
          },
        });

        const finalStates = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
        if (finalStates.includes(order.status)) {
          this.logger.log(
            `Order ${orderId} is already ${order.status}. Finalizing new item ${newItem.id} immediately.`,
          );
          await this.processOrderItemFinalization(orderId, newItem.id, tx);
        }
      });
    }

    return this.getOrderById(orderId);
  }

  async updateOrder(orderId: string, userId: string, updateOrderDto: UpdateOrderDto) {
    const order = await (this.prisma as any).orders.findFirst({
      where: {
        id: orderId,
        user_id: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (updateOrderDto.status) {
      const currentStatus = order.status;
      const newStatus = updateOrderDto.status;

      if (currentStatus === 'CANCELLED' || currentStatus === 'COMPLETED') {
        throw new BadRequestException(`Cannot change order status from ${currentStatus}`);
      }

      if (newStatus === 'CANCELLED') {
        await this.restoreOrderStock(orderId);
      }

      if (newStatus !== 'CANCELLED') {
        const statusOrder: order_status_enum[] = [
          'PENDING',
          'PAID',
          'PROCESSING',
          'SHIPPED',
          'COMPLETED',
        ];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const newIndex = statusOrder.indexOf(newStatus);

        if (newIndex < currentIndex) {
          throw new BadRequestException(
            `Cannot change order status from ${currentStatus} to ${newStatus}`,
          );
        }
      }
    }

    const updatedOrder = await (this.prisma as any).orders.update({
      where: { id: orderId },
      data: {
        ...(updateOrderDto.status && {
          status: updateOrderDto.status,
        }),
      },
      include: {
        items: {
          include: {
            singles: {
              include: {
                categories: true,
                conditions: true,
                languages: true,
                tcgs: true,
                owner: {
                  include: {
                    roles: true,
                  },
                },
              },
            },
          },
        },
        importation_items: true,
        shipping: {
          include: {
            shipping_methods: true,
            user_addresses: true,
          },
        },
        payments: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        },
      },
    });

    if (updateOrderDto.status) {
      const orderRef = orderId.substring(0, 8).toUpperCase();
      const { title, message } = this.buildOrderStatusNotification(orderRef, updateOrderDto.status);
      await this.notifyClient.createNotification({
        userId: order.user_id,
        type: NotificationType.ORDER_STATUS,
        title,
        message,
        data: { orderId, status: updateOrderDto.status },
      });
    }

    return await this.enrichOrder(updatedOrder);
  }

  async deleteOrder(orderId: string, userId: string) {
    const order = await (this.prisma as any).orders.findFirst({
      where: {
        id: orderId,
        user_id: userId,
      },
      include: {
        items: true,
        importation_items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING orders can be deleted');
    }

    await this.restoreOrderStock(orderId);

    await (this.prisma as any).$transaction(async (tx) => {
      await tx.order_items.deleteMany({ where: { order_id: orderId } });
      await tx.order_items_importation.deleteMany({ where: { order_id: orderId } });
      await tx.order_shipping.deleteMany({ where: { order_id: orderId } });
      await tx.payments.deleteMany({ where: { order_id: orderId } });

      await tx.orders.delete({
        where: { id: orderId },
      });
    });

    this.logger.log(`Order ${orderId} deleted by user ${userId}`);
  }

  async deleteOrderById(orderId: string) {
    const order = await (this.prisma as any).orders.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
        importation_items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.restoreOrderStock(orderId);

    await (this.prisma as any).$transaction(async (tx) => {
      await tx.wallet_transactions.updateMany({
        where: { order_id: orderId },
        data: { order_id: null },
      });

      await tx.reviews.updateMany({
        where: { order_id: orderId },
        data: { order_id: null },
      });

      await tx.order_items.deleteMany({ where: { order_id: orderId } });
      await tx.order_items_importation.deleteMany({ where: { order_id: orderId } });
      await tx.order_shipping.deleteMany({ where: { order_id: orderId } });
      await tx.payments.deleteMany({ where: { order_id: orderId } });

      await tx.orders.delete({
        where: { id: orderId },
      });
    });

    this.logger.log(`Order ${orderId} deleted by admin`);
  }

  async undoOrderToCart(orderId: string) {
    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { singles: true },
        },
        importation_items: true,
        payments: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = order.payments[0];
    const isPaidWithCard =
      (payment?.payment_method === 'mercadopago' ||
        payment?.payment_method === 'wallet_plus_mercadopago') &&
      ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(order.status);

    if (isPaidWithCard) {
      throw new BadRequestException(
        'No se puede deshacer una orden que ha sido pagada con Tarjeta (Mercado Pago). Los reembolsos de MP se manejan por separado.',
      );
    }

    for (const item of order.items) {
      if (item.single_id) {
        await this.cartService.addItem(order.user_id, {
          singleId: item.single_id,
          quantity: item.quantity,
          isImportation: false,
        });
      }
    }

    for (const item of order.importation_items) {
      await this.cartService.addItem(order.user_id, {
        importationId: item.importation_id,
        quantity: item.quantity,
        isImportation: true,
        productData: (item.product_data as Record<string, unknown>) || {},
      });
    }

    const walletMethods = ['wallet', 'wallet_plus_mercadopago', 'wallet_plus_transfer'];
    if (walletMethods.includes(payment?.payment_method) && payment?.status === 'approved') {
      let amountToRefund: number;

      if (payment.payment_method === 'wallet') {
        const enriched = await this.enrichOrder(order);
        amountToRefund = parseFloat(enriched.total);
      } else {
        const paymentData = payment.payment_data as { wallet_amount?: number } | null;
        amountToRefund = paymentData?.wallet_amount || 0;
      }

      if (amountToRefund > 0) {
        await (this.prisma as any).$transaction(async (tx) => {
          await tx.users.update({
            where: { id: order.user_id },
            data: { balance: { increment: amountToRefund } },
          });

          await tx.wallet_transactions.create({
            data: {
              user_id: order.user_id,
              amount: new Prisma.Decimal(amountToRefund),
              type: 'ORDER_REFUND',
              order_id: orderId,
              description: `Reembolso por orden deshecha #${orderId.substring(0, 8)}`,
            },
          });
        });

        this.logger.log(`Refunded $${amountToRefund} to wallet for user ${order.user_id}`);
      }
    }

    await this.deleteOrderById(orderId);

    this.logger.log(`Order ${orderId} undone to cart by admin`);
  }

  async updateOrderById(orderId: string, updateOrderDto: UpdateOrderDto) {
    const updatedOrder = await (this.prisma as any).$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: {
          id: orderId,
        },
        include: {
          payments: {
            take: 1,
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (updateOrderDto.status) {
        const currentStatus = order.status;
        const newStatus = updateOrderDto.status;

        if (newStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
          await this.restoreOrderStock(orderId, tx);
        }

        if (
          currentStatus === 'PENDING' &&
          ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(newStatus)
        ) {
          this.logger.log(`Admin confirming order ${orderId} manually. Decreasing stock.`);
          await this.decreaseOrderStock(orderId, tx);
        }
      }

      const updated = await tx.orders.update({
        where: { id: orderId },
        data: {
          ...(updateOrderDto.status && {
            status: updateOrderDto.status,
          }),
          ...(updateOrderDto.status === 'COMPLETED' && {
            delivered_at: new Date(),
          }),
          ...(updateOrderDto.estimatedDeliveryAt !== undefined && {
            estimated_delivery_at: updateOrderDto.estimatedDeliveryAt
              ? new Date(updateOrderDto.estimatedDeliveryAt)
              : null,
          }),
          ...(updateOrderDto.arrivedAt !== undefined && {
            arrived_at: updateOrderDto.arrivedAt ? new Date(updateOrderDto.arrivedAt) : null,
          }),
          ...(updateOrderDto.deliveredAt !== undefined && {
            delivered_at: updateOrderDto.deliveredAt ? new Date(updateOrderDto.deliveredAt) : null,
          }),
          ...(updateOrderDto.importOrderedAt !== undefined && {
            import_ordered_at: updateOrderDto.importOrderedAt
              ? new Date(updateOrderDto.importOrderedAt)
              : null,
          }),
          ...(updateOrderDto.internalOrderNumber !== undefined && {
            internal_order_number: updateOrderDto.internalOrderNumber || null,
          }),
          ...(updateOrderDto.notes !== undefined && {
            notes: updateOrderDto.notes || null,
          }),
          ...(updateOrderDto.trackingEntries !== undefined && {
            tracking_entries: updateOrderDto.trackingEntries as any,
          }),
        },
        include: {
          items: {
            include: {
              singles: true,
            },
          },
          importation_items: true,
          users: true,
          payments: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
        },
      });

      if (
        updateOrderDto.status &&
        ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(updateOrderDto.status)
      ) {
        for (const item of updated.items) {
          await this.processOrderItemFinalization(orderId, item.id, tx);
        }
      }

      return updated;
    });

    const result = await this.enrichOrder(updatedOrder);

    if (updateOrderDto.status === 'PAID') {
      await this.sendOrderCompletionEmails(orderId);
    }

    if (updateOrderDto.status) {
      const orderRef = orderId.substring(0, 8).toUpperCase();
      const { title, message } = this.buildOrderStatusNotification(orderRef, updateOrderDto.status);

      await this.notifyClient.createNotification({
        userId: updatedOrder.user_id,
        type: NotificationType.ORDER_STATUS,
        title,
        message,
        data: { orderId, status: updateOrderDto.status },
      });
    }

    return result;
  }

  async discountAllItems(orderId: string) {
    return await (this.prisma as any).$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { singles: true },
          },
          importation_items: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      for (const item of order.items) {
        await tx.order_items.update({
          where: { id: item.id },
          data: { is_delivered: true },
        });

        await this.processOrderItemFinalization(orderId, item.id, tx);
      }

      for (const item of order.importation_items) {
        await tx.order_items_importation.update({
          where: { id: item.id },
          data: { is_delivered: true },
        });
      }

      return { success: true };
    });
  }

  async handleOrderPaymentUpdate(orderId: string, status: 'PAID' | 'CANCELLED') {
    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            singles: true,
          },
        },
      },
    });

    if (!order) {
      return;
    }

    if (order.status === 'PENDING') {
      if (status === 'PAID') {
        const outOfStockItems = order.items.filter(
          (item) => !item.singles || item.singles.stock < item.quantity,
        );

        if (outOfStockItems.length > 0) {
          await (this.prisma as any).order_items.deleteMany({
            where: { id: { in: outOfStockItems.map((i) => i.id) } },
          });

          const removedNames = outOfStockItems.map((i) => i.singles?.cardName || 'Artículo');
          await this.notifyClient.createNotification({
            userId: order.user_id,
            type: NotificationType.ORDER_STATUS,
            title: 'Artículos sin stock retirados de tu pedido',
            message: `Los siguientes artículos ya no están disponibles y han sido retirados de tu pedido #${orderId.substring(0, 8)}: ${removedNames.join(', ')}.`,
            data: { orderId, removedItems: removedNames },
          });
          this.logger.warn(
            `Order ${orderId}: removed ${outOfStockItems.length} out-of-stock items before finalization`,
          );

          const remainingLocal = await (this.prisma as any).order_items.count({
            where: { order_id: orderId },
          });
          const remainingImportation = await (this.prisma as any).order_items_importation.count({
            where: { order_id: orderId },
          });

          if (remainingLocal === 0 && remainingImportation === 0) {
            await (this.prisma as any).orders.update({
              where: { id: orderId },
              data: { status: 'CANCELLED' },
            });
            await this.notifyClient.createNotification({
              userId: order.user_id,
              type: NotificationType.ORDER_STATUS,
              title: 'Pedido cancelado',
              message: `Tu pedido #${orderId.substring(0, 8)} fue cancelado porque todos los artículos ya no estaban disponibles al momento de confirmar el pago.`,
              data: { orderId },
            });
            this.logger.log(`Order ${orderId} cancelled — all items were out of stock`);
            return;
          }
        }

        await (this.prisma as any).$transaction(async (tx) => {
          await this.finalizePaidOrder(orderId, tx);
        });
        this.logger.log(`Order ${orderId} processed as PAID via ${status} update`);
        await this.sendOrderCompletionEmails(orderId);

        await this.notifyClient.createNotification({
          userId: order.user_id,
          type: NotificationType.PAYMENT_SUCCESS,
          title: '¡Pago Confirmado!',
          message: `Hemos recibido el pago de tu pedido #${orderId.substring(0, 8)}. ¡Gracias!`,
          data: { orderId },
        });
      } else if (status === 'CANCELLED') {
        const latestPayment = await (this.prisma as any).payments.findFirst({
          where: { order_id: orderId },
          orderBy: { created_at: 'desc' },
        });

        const isMixedPayment =
          latestPayment?.payment_method === 'wallet_plus_mercadopago' ||
          latestPayment?.payment_method === 'wallet_plus_transfer';

        if (isMixedPayment && latestPayment?.payment_data) {
          const paymentData = latestPayment.payment_data as { wallet_amount?: number };
          const walletAmount = paymentData.wallet_amount;

          if (walletAmount && walletAmount > 0) {
            await (this.prisma as any).$transaction(async (tx) => {
              await tx.users.update({
                where: { id: order.user_id },
                data: { balance: { increment: walletAmount } },
              });
              await tx.wallet_transactions.create({
                data: {
                  user_id: order.user_id,
                  amount: new Prisma.Decimal(walletAmount),
                  type: 'ORDER_REFUND',
                  order_id: orderId,
                  description: `Reembolso de saldo por cancelación (Pedido ${orderId.substring(0, 8)})`,
                },
              });
            });

            await this.notifyClient.createNotification({
              userId: order.user_id,
              type: NotificationType.WALLET_TX,
              title: 'Reembolso de Saldo',
              message: `Se ha reembolsado $${walletAmount} a tu saldo a favor por la cancelación del pedido #${orderId.substring(0, 8)}.`,
              data: { orderId, amount: walletAmount, type: 'REFUND' },
            });

            this.logger.log(
              `Refunded wallet portion $${walletAmount} for cancelled mixed payment order ${orderId}`,
            );
          }
        }

        await (this.prisma as any).orders.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });
        this.logger.log(`Order ${orderId} marked as CANCELLED via webhook.`);
      }
    }
  }

  private async restoreOrderStock(orderId: string, tx: Prisma.TransactionClient = this.prisma) {
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            singles: true,
          },
        },
        importation_items: true,
        payments: {
          take: 1,
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!order) {
      return;
    }

    const payment = order.payments[0];

    let shouldRestore = false;

    if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
      shouldRestore = true;
    }

    if (!shouldRestore) {
      this.logger.log(
        `Skipping stock restoration for order ${orderId} (Payment: ${payment?.payment_method}, Status: ${order.status})`,
      );
      return;
    }

    for (const item of order.items) {
      if (item.single_id && item.singles) {
        await tx.singles.update({
          where: { id: item.single_id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
        this.logger.log(`Restored ${item.quantity} units of stock for product ${item.single_id}`);
      }
    }

    await this.cacheService.invalidateHomePage();
  }

  async markOrderPaidLocal(orderId: string) {
    const order = await (this.prisma as any).orders.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    await (this.prisma as any).orders.update({
      where: { id: orderId },
      data: { import_fee: new Prisma.Decimal(0) },
    });

    await (this.prisma as any).payments.updateMany({
      where: { order_id: orderId, status: { not: 'approved' } },
      data: { status: 'approved' },
    });

    await this.handleOrderPaymentUpdate(orderId, 'PAID');

    return { success: true };
  }

  async createOrderAsAdmin(adminUserId: string, dto: AdminCreateOrderDto) {
    const { userId, items, shippingMethod: shippingMethodName, addressId, paymentMethod } = dto;

    if (shippingMethodName === ShippingMethod.SHIPPING && !addressId) {
      throw new BadRequestException('Address ID is required for shipping method');
    }

    const shippingMethod = await this.getOrCreateShippingMethod(shippingMethodName.toUpperCase());

    if (shippingMethodName === ShippingMethod.SHIPPING) {
      const address = await (this.prisma as any).user_addresses.findFirst({
        where: { id: addressId, user_id: userId },
      });
      if (!address) {
        throw new NotFoundException('Address not found');
      }
    }

    const orderId = await (this.prisma as any).$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          user_id: userId,
          status: 'PENDING',
        },
      });

      for (const item of items) {
        if (item.isImportation) {
          await tx.order_items_importation.create({
            data: {
              order_id: newOrder.id,
              importation_id: item.productId,
              quantity: item.quantity,
              unit_price: new Prisma.Decimal(item.unitPrice || 0),
              product_data: {},
            },
          });
        } else {
          const single = await tx.singles.findUnique({
            where: { id: item.productId },
            include: { conditions: true },
          });

          if (!single) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          if (single.stock < item.quantity) {
            throw new BadRequestException(`Insufficient stock for ${single.cardName}`);
          }

          let unitPrice = Number(single.price);
          if (single.conditions && single.conditions.discount) {
            const discountPercent = single.conditions.discount;
            unitPrice = Math.round(unitPrice * (1 - discountPercent / 100) * 100) / 100;
          }

          await tx.order_items.create({
            data: {
              order_id: newOrder.id,
              single_id: single.id,
              quantity: item.quantity,
              unit_price: unitPrice,
            },
          });
        }
      }

      if (shippingMethodName === ShippingMethod.SHIPPING && addressId) {
        await tx.order_shipping.create({
          data: {
            order_id: newOrder.id,
            shipping_method_id: shippingMethod.id,
            address_id: addressId,
          },
        });
      }

      return newOrder.id;
    });

    this.logger.log(`Order ${orderId} created by admin ${adminUserId} for user ${userId}`);

    await this.paymentsService.createPayment(orderId, paymentMethod);

    return this.getOrder(orderId, userId);
  }

  async deleteOrders(ids: string[]) {
    const results: { id: string; success: boolean; error?: any }[] = [];
    for (const id of ids) {
      try {
        await this.deleteOrderById(id);
        results.push({ id, success: true });
      } catch (error) {
        this.logger.error(`Failed to delete order ${id}: ${error}`);
        results.push({ id, success: false, error });
      }
    }
    return results;
  }

  private mapLanguageToSpanish(lang: string | undefined): string {
    if (!lang) return 'Inglés';
    const upper = lang.toUpperCase().trim();
    const map: Record<string, string> = {
      JAPANESE: 'Japonés',
      JP: 'Japonés',
      JAPONÉS: 'Japonés',
      ENGLISH: 'Inglés',
      EN: 'Inglés',
      INGLÉS: 'Inglés',
      SPANISH: 'Español',
      ES: 'Español',
      ESPAÑOL: 'Español',
      FRENCH: 'Francés',
      FR: 'Francés',
      FRANCÉS: 'Francés',
      GERMAN: 'Alemán',
      DE: 'Alemán',
      ALEMÁN: 'Alemán',
      ITALIAN: 'Italiano',
      IT: 'Italiano',
      ITALIANO: 'Italiano',
      CHINESE: 'Chino',
      ZH: 'Chino',
      CHINO: 'Chino',
      KOREAN: 'Coreano',
      KO: 'Coreano',
      COREANO: 'Coreano',
      PORTUGUESE: 'Portugués',
      PT: 'Portugués',
      PORTUGUÉS: 'Portugués',
      RUSSIAN: 'Ruso',
      RU: 'Ruso',
      RUSO: 'Ruso',
    };
    return map[upper] || 'Inglés';
  }

  private async decreaseOrderStock(orderId: string, tx: Prisma.TransactionClient = this.prisma) {
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            singles: true,
          },
        },
        importation_items: true,
      },
    });

    if (!order) {
      return;
    }

    for (const item of order.items) {
      await this.processOrderItemFinalization(orderId, item.id, tx);
    }

    this.logger.log(
      `Decreased stock and processed earnings for all local items in order ${orderId}`,
    );
  }

  private async finalizePaidOrder(orderId: string, tx: Prisma.TransactionClient) {
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            singles: true,
          },
        },
        importation_items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found during finalization`);
    }

    for (const item of order.items) {
      await this.processOrderItemFinalization(orderId, item.id, tx);
    }

    await tx.orders.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    const localSingleIds = (order.items || []).map((i: any) => i.single_id).filter(Boolean);
    const importationIds = (order.importation_items || [])
      .map((i: any) => i.importation_id)
      .filter(Boolean);

    if (localSingleIds.length > 0 || importationIds.length > 0) {
      const cart = await tx.carts.findUnique({
        where: { user_id: order.user_id },
      });

      if (cart) {
        await tx.cart_items.deleteMany({
          where: {
            cart_id: cart.id,
            OR: [
              { single_id: { in: localSingleIds }, is_importation: false },
              { importation_id: { in: importationIds }, is_importation: true },
            ],
          },
        });
        this.logger.log(
          `Removed purchased items from cart for user ${order.user_id} after order ${orderId} finalization`,
        );
      }
    }
  }

  private async processOrderItemFinalization(
    orderId: string,
    itemId: string,
    tx: Prisma.TransactionClient,
    qtyToProcess?: number,
  ) {
    const item = await tx.order_items.findUnique({
      where: { id: itemId },
      include: { singles: true },
    });

    if (!item || !item.single_id || !item.singles) return;

    const single = item.singles;
    const ownerId = single.owner_id;

    const qty = qtyToProcess ?? item.quantity;

    if (!ownerId) {
      await tx.singles.updateMany({
        where: { id: item.single_id, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      this.logger.log(`Platform item ${item.id}: stock decremented, no earnings to distribute`);
      return;
    }

    const existingTransaction = await tx.wallet_transactions.findFirst({
      where: {
        user_id: ownerId,
        order_id: orderId,
        type: 'SALE_PROCEEDS',
        description: {
          contains: `Item #${itemId.slice(-8)}`,
        },
      },
    });

    if (existingTransaction) {
      this.logger.log(`Item ${item.id} already processed for order ${orderId}. Skipping.`);
      return;
    }

    const stockUpdate = await tx.singles.updateMany({
      where: {
        id: item.single_id,
        stock: { gte: qty },
      },
      data: {
        stock: { decrement: qty },
      },
    });

    if (stockUpdate.count === 0) {
      this.logger.warn(
        `Potential stock inconsistency for product ${item.single_id} in order ${orderId}`,
      );
    }

    await tx.listings.updateMany({
      where: {
        single_id: item.single_id,
        user_id: ownerId,
        status: 'ACTIVE',
      },
      data: { status: 'SOLD' },
    });

    const earnings = Number(item.unit_price) * qty * 0.9;

    await tx.users.update({
      where: { id: ownerId },
      data: {
        balance: { increment: earnings },
      },
    });

    await tx.wallet_transactions.create({
      data: {
        user_id: ownerId,
        amount: new Prisma.Decimal(earnings),
        type: 'SALE_PROCEEDS',
        order_id: orderId,
        description: `Venta de ${single.cardName} (x${qty}) (Order #${orderId.slice(-8)}, Item #${itemId.slice(-8)} @${Date.now()})`,
      },
    });

    await this.notifyClient.createNotification({
      userId: ownerId,
      type: NotificationType.WALLET_TX,
      title: 'Venta Realizada',
      message: `¡Felicidades! Has recibido $${earnings.toFixed(2)} por la venta de "${single.cardName}" en el pedido #${orderId.substring(0, 8)}.`,
      data: { orderId, amount: earnings, type: 'SALE' },
    });

    await this.cacheService.invalidateHomePage();

    this.logger.log(`Processed finalization for item ${item.id} in order ${orderId}`);
  }

  private async sendOrderCompletionEmails(orderId: string) {
    try {
      const fullOrder = await this.getOrderById(orderId);
      if (!fullOrder || !fullOrder.users) {
        this.logger.warn(
          `Could not send completion emails for order ${orderId}: Order or user not found`,
        );
        return;
      }

      const emailData: PurchaseEmailData = {
        orderId: fullOrder.id,
        customerName:
          `${fullOrder.users.first_name || ''} ${fullOrder.users.last_name || ''}`.trim() ||
          fullOrder.users.username ||
          'Cliente',
        customerEmail: fullOrder.users.email,
        totalAmount: `$${fullOrder.total}`,
        paymentMethod: fullOrder.payment?.paymentMethod || 'Desconocido',
        items: [
          ...(fullOrder.items || []).map((item: any) => ({
            name: item.productData?.cardName || item.productData?.name || 'Producto',
            quantity: item.quantity,
            price: `$${Number(item.unitPrice).toFixed(2)}`,
          })),
          ...(fullOrder.importationItems || []).map((item: any) => ({
            name: item.productData?.cardName || item.productData?.name || 'Producto Importation',
            quantity: item.quantity,
            price: `$${Number(item.unitPrice).toFixed(2)}`,
          })),
        ],
      };

      if (fullOrder.shipping) {
        emailData.shippingMethod = fullOrder.shipping.shippingMethod;

        if (
          fullOrder.shipping.shippingMethod === 'SHIPPING' ||
          fullOrder.shipping.shippingMethod === 'envio'
        ) {
          const completionShippingCost = await this.calculateShippingCost('SHIPPING');
          emailData.items.push({
            name: 'Envío Express',
            quantity: 1,
            price: `$${completionShippingCost.toFixed(2)}`,
          });
        }
      }

      if (fullOrder.importFee) {
        emailData.items.push({
          name: 'Tarifa de Importación',
          quantity: 1,
          price: `$${fullOrder.importFee}`,
        });
      }

      if (fullOrder.paymentServiceFee) {
        emailData.items.push({
          name: 'Comisión de Servicio',
          quantity: 1,
          price: `$${fullOrder.paymentServiceFee}`,
        });
      }

      await Promise.all([
        this.notifyClient.sendPaymentConfirmation(emailData),
        this.notifyClient.sendCustomerPaymentConfirmation(emailData),
      ]);

      this.logger.log(`Completion emails sent for order ${orderId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send completion emails for order ${orderId}: ${error.message}`);
    }
  }

  async payWithWallet(userId: string, orderId: string) {
    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { singles: true },
        },
        importation_items: true,
        shipping: {
          include: { shipping_methods: true },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('No tienes permiso para pagar esta orden');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Esta orden no está pendiente de pago');
    }

    const enriched = await this.enrichOrder(order);
    const total = parseFloat(enriched.total);

    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
    });

    if (!user || Number(user.balance) < total) {
      throw new BadRequestException('Saldo insuficiente en tu wallet.');
    }

    const result = await (this.prisma as any).$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userId },
        data: {
          balance: { decrement: total },
        },
      });

      await tx.wallet_transactions.create({
        data: {
          user_id: userId,
          amount: new Prisma.Decimal(-total),
          type: 'PURCHASE',
          order_id: orderId,
          description: `Compra de artículos (Pedido ${orderId.substring(0, 8)})`,
        },
      });

      await tx.payments.create({
        data: {
          order_id: orderId,
          payment_method: 'wallet',
          status: 'approved',
          payment_data: { total_paid: total },
        },
      });

      await this.finalizePaidOrder(orderId, tx);

      return { success: true };
    });

    await this.sendOrderCompletionEmails(orderId);

    return result;
  }

  async payWithMercadoPago(userId: string, orderId: string) {
    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { singles: true } },
        importation_items: true,
        shipping: { include: { shipping_methods: true } },
        payments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.user_id !== userId)
      throw new ForbiddenException('No tienes permiso para pagar esta orden');
    if (order.status !== 'PENDING')
      throw new BadRequestException('Esta orden no está pendiente de pago');

    const mpItems: Array<{ title: string; quantity: number; unit_price: number }> = [];

    for (const item of order.items) {
      const single = item.singles;
      const title = (single?.cardName as string) || 'Producto';
      const unitPrice = Math.round(parseFloat(item.unit_price.toString()) * 100) / 100;
      if (unitPrice > 0) mpItems.push({ title, quantity: item.quantity, unit_price: unitPrice });
    }

    for (const item of order.importation_items) {
      const pd = item.product_data as { cardName?: string; name?: string } | null;
      const title = pd?.cardName || pd?.name || 'Producto';
      const unitPrice = Math.round(parseFloat(item.unit_price.toString()) * 100) / 100;
      if (unitPrice > 0) mpItems.push({ title, quantity: item.quantity, unit_price: unitPrice });
    }

    if (order.shipping) {
      const retryShippingCost = await this.calculateShippingCost('SHIPPING');
      mpItems.push({ title: 'Envío Express', quantity: 1, unit_price: retryShippingCost });
    }

    const importFeeAmount =
      order.import_fee != null
        ? Number(order.import_fee)
        : order.importation_items.length > 0
          ? 40.0
          : 0;
    if (importFeeAmount > 0) {
      mpItems.push({ title: 'Tarifa de Importación', quantity: 1, unit_price: importFeeAmount });
    }

    const total = mpItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const MP_MINIMUM_AMOUNT = 50;
    if (total < MP_MINIMUM_AMOUNT) {
      throw new BadRequestException(
        `El monto mínimo para pagar con Mercado Pago es de $${MP_MINIMUM_AMOUNT} MXN`,
      );
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    let baseUrl = frontendUrl.split(',')[0].trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl =
        baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
          ? `http://${baseUrl}`
          : `https://${baseUrl}`;
    }
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
      select: { email: true, first_name: true, last_name: true },
    });

    const preference = await this.paymentsService.createMercadoPagoPreference(
      orderId,
      mpItems,
      {
        success: `${baseUrl}/profile/orders/${orderId}?status=success`,
        failure: `${baseUrl}/profile/orders/${orderId}?status=failure`,
        pending: `${baseUrl}/profile/orders/${orderId}?status=pending`,
      },
      user ? { email: user.email, name: user.first_name, surname: user.last_name } : undefined,
    );

    await this.paymentsService.createPayment(orderId, 'mercadopago', preference.preference_id, {
      preference,
    });

    return {
      preferenceId: preference.preference_id,
      initPoint: preference.init_point,
    };
  }

  async verifyAndUpdatePayment(orderId: string, userId: string, mpPaymentId: string) {
    if (!mpPaymentId) {
      throw new BadRequestException('paymentId is required');
    }

    const order = await (this.prisma as any).orders.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        payments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = order.payments[0];
    const isMpPayment =
      payment?.payment_method === 'mercadopago' ||
      payment?.payment_method === 'wallet_plus_mercadopago';
    if (!payment || !isMpPayment) {
      return { verified: false, message: 'Not a Mercado Pago order' };
    }

    if (order.status !== 'PENDING') {
      return { verified: true, status: order.status };
    }

    const verification = await this.paymentsService.verifyPayment(mpPaymentId);

    if (!verification.verified) {
      return { verified: false, message: 'Could not verify payment' };
    }

    const mpStatus = verification.status || 'pending';
    await this.paymentsService.updatePayment(
      payment.id,
      mpPaymentId,
      verification.payment,
      mpStatus,
    );

    if (mpStatus === 'approved') {
      await (this.prisma as any).$transaction(async (tx) => {
        await this.finalizePaidOrder(orderId, tx);
      });
      this.logger.log(`Order ${orderId} verified as PAID via redirect verification`);
      await this.sendOrderCompletionEmails(orderId);
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      await (this.prisma as any).orders.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    }

    const updatedOrder = await this.getOrder(orderId, userId);
    return { verified: true, status: mpStatus, order: updatedOrder };
  }

  async getSales(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      (this.prisma as any).wallet_transactions.findMany({
        where: {
          type: 'SALE_PROCEEDS',
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              username: true,
              email: true,
            },
          },
          orders: {
            include: {
              items: {
                include: {
                  singles: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      (this.prisma as any).wallet_transactions.count({
        where: {
          type: 'SALE_PROCEEDS',
        },
      }),
    ]);

    const enhancedSales = transactions.map((t: any) => {
      const orders = t.orders;
      const cardInfo = orders?.items.find((item: any) =>
        t.description.includes(item.singles?.cardName || item.singles?.name),
      );

      return {
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        createdAt: t.created_at,
        orderId: t.order_id,
        orderNumber: orders?.order_number || t.order_id?.slice(-6).toUpperCase(),
        seller: t.users,
        product: cardInfo
          ? {
              name: cardInfo.singles.cardName || cardInfo.singles.name,
              image: cardInfo.singles.image,
              expansion: cardInfo.singles.expansion,
              condition: cardInfo.singles.condition,
              language: cardInfo.singles.language,
              isFoil: cardInfo.singles.is_foil || cardInfo.singles.foil,
            }
          : null,
      };
    });

    return {
      data: enhancedSales,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async requestReview(orderId: string) {
    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return (this.prisma as any).orders.update({
      where: { id: orderId },
      data: { review_requested: true },
    });
  }

  async getOrderPaymentBalance(orderId: string): Promise<{
    paidAmount: number;
    currentTotal: number;
    difference: number;
    paymentMethod: string;
    orderStatus: string;
    needsSupplementalPayment: boolean;
  }> {
    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { singles: true } },
        importation_items: true,
        shipping: { include: { shipping_methods: true, user_addresses: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const payments = await (this.prisma as any).payments.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
      take: 1,
    });

    const enriched = await this.enrichOrder({ ...order, payments });
    const currentTotal = parseFloat(enriched.total ?? '0');

    const payment = payments[0];
    let paidAmount = 0;
    const paymentMethod = payment?.payment_method ?? 'unknown';

    if (payment) {
      const pd = payment.payment_data as Record<string, unknown> | null;

      switch (paymentMethod) {
        case 'mercadopago': {
          paidAmount = Number(pd?.transaction_amount ?? 0);
          break;
        }
        case 'wallet': {
          paidAmount = currentTotal;
          break;
        }
        case 'wallet_plus_mercadopago':
        case 'wallet_plus_transfer': {
          const walletAmt = Number(pd?.wallet_amount ?? 0);
          const remainder = Number(pd?.remainder ?? 0);
          paidAmount = walletAmt + remainder;
          break;
        }
        case 'transfer': {
          paidAmount = currentTotal;
          break;
        }
        default: {
          paidAmount = 0;
        }
      }
    }

    const difference = parseFloat((currentTotal - paidAmount).toFixed(2));
    const isPaidOrder = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(order.status);
    const needsSupplementalPayment =
      difference > 0.5 && isPaidOrder && paymentMethod === 'mercadopago';

    return {
      paidAmount,
      currentTotal,
      difference,
      paymentMethod,
      orderStatus: order.status,
      needsSupplementalPayment,
    };
  }

  async reopenOrderForSupplementalPayment(orderId: string): Promise<{
    initPoint: string;
    preferenceId: string;
    difference: number;
  }> {
    const balance = await this.getOrderPaymentBalance(orderId);

    if (balance.difference <= 0) {
      throw new BadRequestException('Order has no outstanding balance');
    }
    if (!balance.needsSupplementalPayment) {
      throw new BadRequestException(
        `Only PAID Mercado Pago orders can be reopened for supplemental payment. ` +
          `Current method: ${balance.paymentMethod}, status: ${balance.orderStatus}`,
      );
    }

    const order = await (this.prisma as any).orders.findUnique({
      where: { id: orderId },
      include: { users: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backUrls = {
      success: `${frontendUrl}/profile/orders/${orderId}?payment=success`,
      failure: `${frontendUrl}/profile/orders/${orderId}?payment=failure`,
      pending: `${frontendUrl}/profile/orders/${orderId}?payment=pending`,
    };

    const supplementItem = {
      title: `Saldo pendiente - Pedido #${orderId.substring(0, 8).toUpperCase()}`,
      quantity: 1,
      unit_price: balance.difference,
    };

    const preference = await this.paymentsService.createMercadoPagoPreference(
      orderId,
      [supplementItem],
      backUrls,
      order.users?.email ? { email: order.users.email } : undefined,
    );

    await (this.prisma as any).$transaction(async (tx) => {
      await tx.payments.create({
        data: {
          order_id: orderId,
          payment_method: 'mercadopago_supplement',
          mercadopago_preference_id: preference.preference_id,
          status: 'pending',
          payment_data: {
            supplemental: true,
            amount: balance.difference,
            original_paid: balance.paidAmount,
            new_total: balance.currentTotal,
          } as any,
        },
      });

      await (this.prisma as any).orders.update({
        where: { id: orderId },
        data: { status: 'PENDING' },
      });
    });

    this.logger.log(
      `Order ${orderId} reopened for supplemental payment of $${balance.difference} MXN. ` +
        `Preference: ${preference.preference_id}`,
    );

    return {
      initPoint: preference.init_point ?? '',
      preferenceId: preference.preference_id ?? '',
      difference: balance.difference,
    };
  }
}
