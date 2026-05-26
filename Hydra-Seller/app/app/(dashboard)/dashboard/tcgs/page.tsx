import { Metadata } from 'next';
import TcgsContent from './tcgs-content';

export const metadata: Metadata = {
  title: 'TCGs | Hydra Seller',
};

export default function TcgsPage() {
  return <TcgsContent />;
}
