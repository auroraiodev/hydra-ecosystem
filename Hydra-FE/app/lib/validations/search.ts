import { z } from 'zod';

const SearchResultSchema = z.object({
  id: z.string().nullable().optional(),
  borderless: z.boolean().optional(),
  cardName: z.string(),
  cardNumber: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  expansion: z.string().nullable().optional(),
  extendedArt: z.boolean().nullable().optional(),
  finalPrice: z.union([z.string(), z.number()]).nullable().optional(),
  foil: z.boolean().nullable().optional(),
  importationId: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  isLocalInventory: z.boolean().nullable().optional(),
  language: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  metadata: z.array(z.string()).nullable().optional(),
  prerelease: z.boolean().nullable().optional(),
  premierPlay: z.boolean().nullable().optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  originalPrice: z.union([z.string(), z.number()]).nullable().optional(),
  stock: z.number().nullable().optional(),
  surgeFoil: z.boolean().nullable().optional(),
  tags: z.array(z.any()).nullable().optional(),
  variant: z.string().nullable().optional(),
  hareruyaId: z.string().nullable().optional(),
  basePriceJPY: z.number().nullable().optional(),
  basePriceMXN: z.number().nullable().optional(),
  importFeeMXN: z.number().nullable().optional(),
  price_mxn_importation: z.number().nullable().optional(),
  price_mxn_local: z.number().nullable().optional(),
  soldBy: z.string().nullable().optional(),
  storeLogo: z.string().nullable().optional(),
  store: z
    .object({
      name: z.string(),
      logo_url: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  seller: z
    .object({
      name: z.string(),
      logo_url: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const SearchPaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const SearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SearchResultSchema),
  localCount: z.number(),
  importationCount: z.number().optional(),
  updatedPrices: z.number().optional(),
  pagination: SearchPaginationSchema.optional(),
});


