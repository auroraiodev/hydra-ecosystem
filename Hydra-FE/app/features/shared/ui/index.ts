// ── Design system (arcane-vault-ui) ──────────────────────────────────────
// All generic UI components are sourced from the shared design system.
// Next.js-specific wrappers (Link, SearchInput) are kept locally and exported below.
export {
  VaultBadge,
  ConditionChip,
  VaultProductBadges,
  Divider,
  Checkbox,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  useToast,
} from 'arcane-vault-ui';

// ── Next.js-specific local wrappers ───────────────────────────────────────
// These components depend on next/link, next/navigation, or app-level state
// and remain in hydra-fe. They wrap their arcane-vault-ui counterparts.

export { Link } from './Link';
export { SearchInput } from './SearchInput';
export { Modal } from './Modal';
export { FlowButton } from './flow-button';
export { Input } from './Input';
export { CardSkeleton } from './CardSkeleton';
