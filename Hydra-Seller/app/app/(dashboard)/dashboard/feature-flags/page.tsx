import type { Metadata } from 'next';
import FeatureFlagsContent from './feature-flags-content';

export const metadata: Metadata = {
  title: 'Feature Flags — Hydra Seller',
  description: 'Enable or disable games, features, and platform sections.',
};

export default function FeatureFlagsPage() {
  return <FeatureFlagsContent />;
}
