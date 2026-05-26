import { permanentRedirect } from 'next/navigation';

export default async function SinglesPage() {
  permanentRedirect('/singles/search');
}
