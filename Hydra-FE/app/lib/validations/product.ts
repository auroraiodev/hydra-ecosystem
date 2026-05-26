import { z } from 'zod';

export const CardDataSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    subtitle: z.string().nullable().optional(),
    price: z.union([z.string(), z.number()]),
    imageUrl: z.string().url().or(z.string().startsWith('/')).or(z.string().nullable()).optional(),
    grade: z.string().nullable().optional(),
    gradeColor: z.string().nullable().optional(),
    href: z.string().nullable().optional(),
    stock: z.number().nullable().optional(),
    expansion: z.string().nullable().optional(),
    variant: z.string().nullable().optional(),
    cardName: z.string().nullable().optional(),
    condition: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    immediateDelivery: z.boolean().nullable().optional(),
    isLocalInventory: z.boolean().nullable().optional(),
    foil: z.boolean().nullable().optional(),
    surgeFoil: z.boolean().nullable().optional(),
    cardNumber: z.string().nullable().optional(),
    metadata: z.array(z.string()).nullable().optional(),
    images: z.array(z.string()).nullable().optional(),
    tags: z.array(z.any()).nullable().optional(),
    importationId: z.string().nullable().optional(),
    originalPrice: z.union([z.string(), z.number()]).nullable().optional(),
    rating: z.number().nullable().optional(),
    reviewCount: z.number().nullable().optional(),
    isNew: z.boolean().nullable().optional(),
    isOnSale: z.boolean().nullable().optional(),
    discountPercentage: z.number().nullable().optional(),
    isBundle: z.boolean().nullable().optional(),
    basePriceJPY: z.number().nullable().optional(),
    basePriceMXN: z.number().nullable().optional(),
    importFeeMXN: z.number().nullable().optional(),
    finalPrice: z.number().nullable().optional(),
  })
  .passthrough();


