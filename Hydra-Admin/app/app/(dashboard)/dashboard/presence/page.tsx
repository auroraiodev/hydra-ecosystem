import type { Metadata } from 'next';
import PresenceContent from './presence-content';

export const metadata: Metadata = {
  title: 'Usuarios Conectados | Hydra Admin',
};

export default function PresencePage() {
  return <PresenceContent />;
}
