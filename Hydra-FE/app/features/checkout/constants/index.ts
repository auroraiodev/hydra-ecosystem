import { User, Truck, CreditCard } from 'lucide-react';

export const MP_MINIMUM_AMOUNT = 50;

// @knip-ignore - unused export kept for reference
// export const SHIPPING_COST = 280;
// @knip-ignore - unused export kept for reference
// export const FREE_SHIPPING_THRESHOLD = 3000;

export const STEP_LABELS = ['Contacto', 'Envío', 'Pago'];
export const STEP_ICONS = [User, Truck, CreditCard];

export const DEFAULT_NEW_ADDRESS = {
  street: '',
  city: '',
  state: '',
  zip_code: '',
  country: 'México',
  receiver_name: '',
};

// @knip-ignore - unused export kept for reference
// export const PAYMENT_METHODS = [
//   {
//     id: 'transfer',
//     name: 'Transferencia bancaria',
//     subtitle: 'SPEI / Depósito (0% comisión)',
//   },
//   {
//     id: 'mercadopago',
//     name: 'Mercado Pago',
//     subtitle: 'Tarjeta, efectivo o mensualidades',
//   },
//   {
//     id: 'wallet',
//     name: 'Wallet Hydra',
//     subtitle: 'Usa tu saldo disponible en la plataforma',
//   },
// ] as const;

// @knip-ignore - unused export kept for reference
// export const SHIPPING_METHODS = [
//   {
//     id: 'shipping',
//     label: 'Envío a domicilio',
//   },
//   {
//     id: 'arrange',
//     label: 'Acordar con vendedor',
//   },
// ] as const;
