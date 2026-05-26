import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buscar Singles de Magic: The Gathering',
  description:
    'Busca entre miles de singles de Magic: The Gathering. Encuentra las cartas que necesitas para tus decks con los mejores precios en México.',
};

export default function SinglesSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
