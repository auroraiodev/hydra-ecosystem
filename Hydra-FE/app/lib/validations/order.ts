import { z } from 'zod';

const OrderItemSchema = z.object({
  id: z.string(),
  singleId: z.string().nullable().optional(),
  importationId: z.string().nullable().optional(),
  quantity: z.number(),
  unitPrice: z.union([z.string(), z.number()]),
  productData: z.any().optional(),
  isDelivered: z.boolean().optional(),
});

const OrderShippingSchema = z.object({
  id: z.string(),
  shippingMethod: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
    receiverName: z.string().optional(),
  }),
});

const PaymentSchema = z.object({
  id: z.string(),
  paymentMethod: z.string(),
  mercadopagoPaymentId: z.string().nullish(),
  mercadopagoPreferenceId: z.string().nullish(),
  status: z.string(),
  paymentData: z.any().optional(),
});

export const OrderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  createdAt: z.string(),
  items: z.array(OrderItemSchema),
  importationItems: z.array(OrderItemSchema),
  shipping: OrderShippingSchema.optional(),
  payment: PaymentSchema.optional(),
  total: z.string(),
  subtotal: z.string().optional(),
  shippingCost: z.string().optional(),
  importFee: z.string().optional(),
  paymentServiceFee: z.string().optional(),
  walletApplied: z.string().optional(),
  remainingToPay: z.string().optional(),
  estimatedDeliveryAt: z.string().nullish(),
  arrivedAt: z.string().nullish(),
  deliveredAt: z.string().nullish(),
  importOrderedAt: z.string().nullish(),
  internalOrderNumber: z.string().nullish(),
  trackingEntries: z
    .array(
      z.object({
        date: z.string(),
        time: z.string(),
        origin: z.string(),
        event: z.string(),
      })
    )
    .nullish(),
});
