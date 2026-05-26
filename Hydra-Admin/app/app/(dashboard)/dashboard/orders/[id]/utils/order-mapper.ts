import type { Order } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackendOrderToOrder(backendOrder: any): Order {
  const user =
    backendOrder.userId || backendOrder.user_id || backendOrder.users
      ? {
          id:
            backendOrder.userId ||
            backendOrder.user_id ||
            backendOrder.users?.id ||
            backendOrder.users?._id,
          email: backendOrder.users?.email || backendOrder.user_email || '',
          name: (() => {
            const u = backendOrder.users;
            if (!u) return 'Usuario';
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            return fullName || u.username || u.email || 'Usuario';
          })(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: (backendOrder.users?.role || 'user') as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: (backendOrder.users?.isActive !== false ? 'active' : 'inactive') as any,
          joinDate: backendOrder.users?.created_at || new Date().toISOString(),
        }
      : undefined;

  return {
    id: backendOrder.id || backendOrder._id,
    orderNumber:
      backendOrder.order_number ||
      backendOrder.orderNumber ||
      `ORD-${(backendOrder.id || backendOrder._id).slice(-6).toUpperCase()}`,
    user,
    customer: user?.name || backendOrder.customer_name || backendOrder.customer || 'Usuario',
    email: user?.email || backendOrder.customer_email || backendOrder.email || '',
    status: (() => {
      const s = (backendOrder.status || 'pending').toUpperCase();
      if (s === 'PAID') return 'paid';
      if (s === 'PROCESSING') return 'processing';
      if (s === 'COMPLETED') return 'delivered';
      return s.toLowerCase();
    })(),
    total: Number(backendOrder.total_amount) || Number(backendOrder.total) || 0,
    items: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(backendOrder.items || []).map((item: any) => {
        const product = item.productData || item.singles || item.products || item.product;
        const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
        const quantity = Number(item.quantity || 1);
        const isLocal = item.isLocalInventory !== false;

        return {
          id: item.id || `local-${item.singleId || item.single_id || Math.random()}`,
          productId: item.singleId || item.product_id || item.productId,
          productName:
            product?.cardName ||
            product?.name ||
            product?.title ||
            item.name ||
            item.productName ||
            '',
          quantity: quantity,
          price: unitPrice,
          unitPrice: unitPrice,
          totalPrice: unitPrice * quantity,
          isDelivered: item.isDelivered || item.is_delivered || false,
          deliveryStatus:
            item.delivery_status || item.deliveryStatus || (item.is_delivered ? 'sold' : 'pending'),
          isLocalInventory: isLocal,
          product: product
            ? {
                id: product.id || product._id,
                name: product.cardName || product.name || product.title || '',
                cardSet: product.expansion || product.set_name || '',
                rarity: product.rarities?.name || 'rare',
                price: unitPrice,
                stock: Number(product.in_stock || product.inStock || 0),
                condition:
                  product.conditions?.display_name ||
                  product.conditions?.name ||
                  product.condition ||
                  'Near Mint',
                image: product.img || product.image || product.imageUrl || product.url_image || '',
                language:
                  product.languages?.display_name ||
                  product.languages?.name ||
                  product.language ||
                  item.language ||
                  'English',
                isFoil:
                  item.isFoil ||
                  item.is_foil ||
                  product.isFoil ||
                  product.is_foil ||
                  product.foil ||
                  false,
                cardNumber: product.cardNumber || product.card_number || item.cardNumber || '',
                variant: product.variant || item.variant || '',
                owner: product.owner,
                importationId: product.importation_id || product.importationId,
                isLocalInventory: isLocal,
                originLabel: isLocal ? 'Local' : 'Importación',
              }
            : undefined,
        };
      }),
      ...(backendOrder.importationItems || backendOrder.importation_items || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => {
          const product = item.productData || item.product_data;
          const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
          const quantity = Number(item.quantity || 1);
          return {
            id:
              item.id ||
              `importation-${item.importationId || item.importation_id || Math.random()}`,
            productId: item.importationId || item.importation_id,
            productName: product?.cardName || product?.name || 'Importation Product',
            quantity: quantity,
            price: unitPrice,
            unitPrice: unitPrice,
            totalPrice: unitPrice * quantity,
            isDelivered: item.isDelivered || item.is_delivered || false,
            deliveryStatus:
              item.delivery_status ||
              item.deliveryStatus ||
              (item.is_delivered ? 'sold' : 'pending'),
            isLocalInventory: false,
            product: product
              ? {
                  id: item.importationId || item.importation_id,
                  name: product.cardName || product.name || 'Importation Product',
                  cardSet: product.expansion || '',
                  rarity: product.rarity || '',
                  price: unitPrice,
                  stock: 99, // Assumed for Importation
                  condition: product.condition || 'Near Mint',
                  image:
                    product.img || product.image || product.imageUrl || product.url_image || '',
                  language: product.language || item.language || 'Japanese',
                  isFoil:
                    item.isFoil ||
                    item.is_foil ||
                    product.isFoil ||
                    product.is_foil ||
                    product.foil ||
                    false,
                  cardNumber: product.cardNumber || item.cardNumber || '',
                  variant: product.variant || '',
                  importationId: item.importationId || item.importation_id,
                  isLocalInventory: false,
                  originLabel: 'Importación',
                }
              : undefined,
          };
        }
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(backendOrder.order_items || []).map((item: any) => {
        // Fallback/Legacy
        const product = item.products || item.product;
        const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0);
        const quantity = Number(item.quantity || 1);
        return {
          id: item.id || `legacy-${item.product_id || item.productId || Math.random()}`,
          productId: item.product_id || item.productId,
          productName: product?.name || product?.title || item.name || item.productName || '',
          quantity: quantity,
          price: unitPrice,
          unitPrice: unitPrice,
          totalPrice: unitPrice * quantity, // Fallback calculation if total_price missing
          isDelivered: item.isDelivered || item.is_delivered || false,
          product: product
            ? {
                id: product.id || product._id,
                name: product.name || product.title || '',
                cardSet: product.expansion || product.set_name || '',
                rarity: product.rarities?.name || 'rare',
                price: unitPrice,
                stock: Number(product.in_stock || product.inStock || 0),
                condition:
                  product.conditions?.display_name ||
                  product.conditions?.name ||
                  product.condition ||
                  'near-mint',
                image: product.img || product.image || product.imageUrl || product.url_image || '',
                language: product.language || item.language || 'English',
                isFoil:
                  item.isFoil ||
                  item.is_foil ||
                  product.isFoil ||
                  product.is_foil ||
                  product.foil ||
                  false,
                cardNumber: product.cardNumber || product.card_number || '',
                variant: product.variant || '',
              }
            : undefined,
        };
      }),
    ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i), // Dedupe based on item ID, not productId
    orderDate: backendOrder.created_at || backendOrder.orderDate || new Date().toISOString(),
    shippingDate: backendOrder.shipping_date || backendOrder.shippingDate,
    deliveryLocationId: backendOrder.delivery_location_id || backendOrder.deliveryLocationId,
    deliveryPointId: backendOrder.delivery_point_id || backendOrder.deliveryPointId,
    importFee: Number(backendOrder.importFee) || Number(backendOrder.import_fee) || 0,
    paymentServiceFee:
      Number(backendOrder.paymentServiceFee) || Number(backendOrder.payment_service_fee) || 0,
    paymentMethod: backendOrder.payment?.paymentMethod || backendOrder.payment_method || 'transfer',
    paymentStatus: backendOrder.payment?.status || backendOrder.payment_status || 'pending',
    estimatedDeliveryAt: backendOrder.estimatedDeliveryAt || backendOrder.estimated_delivery_at,
    arrivedAt: backendOrder.arrivedAt || backendOrder.arrived_at,
    deliveredAt: backendOrder.deliveredAt || backendOrder.delivered_at,
    importOrderedAt: backendOrder.importOrderedAt || backendOrder.import_ordered_at,
    reviewRequested: backendOrder.review_requested || false,
    internalOrderNumber:
      backendOrder.internalOrderNumber || backendOrder.internal_order_number || undefined,
    notes: backendOrder.notes || undefined,
    trackingEntries: backendOrder.trackingEntries || backendOrder.tracking_entries || undefined,
  };
}
