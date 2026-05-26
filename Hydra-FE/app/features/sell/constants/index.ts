import {
  ShieldCheck,
  Zap,
  Package,
  ClipboardList,
  Sparkles,
  Shield,
  FileSearch,
  Wallet,
} from 'lucide-react';
import { SellBenefit, SellFAQItem, SellProcessStep } from '../types/Sell.types';

export const SELL_BENEFITS: SellBenefit[] = [
  {
    title: 'Revisión Experta',
    description: 'Garantizamos que tus cartas sean originales y el estado sea el correcto.',
    icon: ShieldCheck,
  },
  {
    title: 'Comisión del 12%',
    description: 'Solo pagas cuando vendes. Sin letras chiquitas ni costos ocultos.',
    icon: Zap,
  },
  {
    title: 'Custodia Segura',
    description: 'Tus cartas están protegidas en nuestra oficina hasta el momento de la venta.',
    icon: Package,
  },
];

export const SELL_FAQS: SellFAQItem[] = [
  {
    question: '¿Qué puedo vender?',
    answer:
      'Cualquier carta de Magic: The Gathering (singles) o producto sellado. Actualmente el servicio está limitado a cierta región del país.',
  },
  {
    question: '¿Cuánto es la comisión?',
    answer: 'La comisión es del 12% sobre el precio final de venta.',
  },
  {
    question: '¿Cuándo me pagan?',
    answer: 'Te pagamos en cuanto tus piezas se vendan en nuestro marketplace.',
  },
  {
    question: '¿Cómo envían mis cartas?',
    answer:
      'Nosotros nos encargamos del empaque y envío al comprador final una vez realizada la venta.',
  },
];

export const SELL_STEPS: SellProcessStep[] = [
  {
    number: '01',
    title: 'Prepara tus cartas',
    description: 'Revisa tus singles o producto sellado. Confirma que estén en buen estado.',
    icon: ClipboardList,
  },
  {
    number: '02',
    title: 'Envía tu lista',
    description: 'Llena el formulario con lo que quieres vender para que estemos listos.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Mándalo a Hydra',
    description: 'Enviamos tus cartas y procesamos los pagos de forma segura.',
    icon: Shield,
  },
  {
    number: '04',
    title: 'Evaluación',
    description: 'Revisamos autenticidad y estado físico de cada pieza recibida.',
    icon: FileSearch,
  },
  {
    number: '05',
    title: 'Pago tras Venta',
    description: 'Recibe tu dinero una vez que los artículos sean validados.',
    icon: Wallet,
  },
];

export const SELL_COMMISSION_PERCENT = 12;
export const SELL_CATEGORY_LIMIT = 'Solo MTG y cierta región del país por ahora';
