import { Metadata } from 'next';
import CategoriesContent from './categories-content';

export const metadata: Metadata = {
  title: 'Categorías | Hydra Seller',
};

export default function CategoriesPage() {
  return <CategoriesContent />;
}
