import { z } from 'zod';

// The productData field in cart items can have varying shapes depending on whether
// it's a local product or an importation product. We use a loose schema here and rely
// on the CartItemResponse TypeScript type for proper typing in consuming code.
const CartProductDataSchema = z
  .object({
    // Identifiers
    id: z.string().optional(),
    // Display names — cart items use different field names per product type
    title: z.string().optional(),
    cardName: z.string().optional(),
    name: z.string().optional(),
    subtitle: z.string().optional(),
    // Pricing
    price: z.union([z.string(), z.number()]).optional(),
    finalPrice: z.union([z.string(), z.number()]).optional(),
    originalPrice: z.union([z.string(), z.number()]).optional(),
    // Images
    imageUrl: z.string().nullable().optional(),
    img: z.string().nullable().optional(),
    // Product attributes
    expansion: z.string().nullable().optional(),
    variant: z.string().nullable().optional(),
    condition: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    cardNumber: z.string().nullable().optional(),
    foil: z.boolean().nullable().optional(),
    isLocalInventory: z.boolean().nullable().optional(),
    importationId: z.string().nullable().optional(),
    stock: z.number().nullable().optional(),
    // Extra
    href: z.string().optional(),
    grade: z.string().optional(),
    gradeColor: z.string().optional(),
    immediateDelivery: z.boolean().optional(),
    metadata: z.array(z.string()).nullable().optional(),
    images: z.array(z.string()).nullable().optional(),
    tags: z.array(z.any()).nullable().optional(),
    rating: z.number().optional(),
    reviewCount: z.number().optional(),
    isNew: z.boolean().optional(),
    isOnSale: z.boolean().optional(),
    discountPercentage: z.number().optional(),
    isBundle: z.boolean().optional(),
    owner: z
      .object({
        id: z.string().optional(),
        email: z.string().optional(),
        username: z.string().nullable().optional(),
        first_name: z.string().nullable().optional(),
        last_name: z.string().nullable().optional(),
      })
      .optional(),
  })
  .passthrough(); // allow extra unknown fields from the backend

const CartItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().positive(),
  isImportation: z.boolean(),
  importationId: z.string().nullable().optional(),
  singleId: z.string().nullable().optional(),
  productData: CartProductDataSchema,
});

export const CartResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CartItemSchema),
});

