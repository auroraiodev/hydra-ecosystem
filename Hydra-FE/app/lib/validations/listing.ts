import { z } from 'zod';

const ListingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.enum(['ACTIVE', 'SOLD', 'DISABLED', 'IN_TRANSIT', 'IN_MEXICO', 'UNLISTED']),
  single_id: z.string(),
  singles: z.object({
    id: z.string(),
    name: z.string().optional(),
    cardName: z.string().nullable().optional(),
    price: z.string(),
    img: z.string().nullable().optional(),
    expansion: z.string().nullable().optional(),
    variant: z.string().nullable().optional(),
    foil: z.boolean(),
    surgeFoil: z.boolean().optional(),
    condition_id: z.string().nullable().optional(),
    stock: z.number().optional(),
    conditions: z
      .object({
        display_name: z.string(),
        discount: z.number(),
        id: z.string().optional(),
        name: z.string().optional(),
        code: z.string().optional(),
      })
      .nullable()
      .optional(),
  }),
  earnings: z.number().optional(),
  commission_rate: z.number().optional(),
});

export const MyListingsResponseSchema = z.object({
  data: z.array(ListingSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type Listing = z.infer<typeof ListingSchema>;

