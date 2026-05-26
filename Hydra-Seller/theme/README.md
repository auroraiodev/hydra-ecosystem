# Arcane Vault UI

Glassmorphism design system extracted from [Hydra Collect](https://hydracollect.com). Dark-mode-first, Tailwind CSS v4, React 18+.

## Components

| Component | Description |
|-----------|-------------|
| `Button` / `FlowButton` | Animated circle-expansion CTA with 8 variants |
| `Badge` | Inline badge with CVA variants |
| `VaultBadge` | Glassmorphic badge — 8 color variants |
| `Alert` | Status alert with error / success / info / warning / vault types |
| `Input` | Text input with label, icon slot, error state, and password toggle |
| `Card` | Compositional card — supports `vault` glassmorphism prop |
| `Modal` | Accessible portal modal with focus trap & Escape handling |
| `Skeleton` | Shimmer skeleton — light and vault (dark) variants |
| `CardSkeleton` | Opinionated card loading skeleton |
| `Divider` | Horizontal/vertical divider with optional label |
| `Checkbox` | Custom-styled checkbox |
| `Toast` / `Toaster` | Toast notifications + `useToast` hook |
| `VaultSearch` | Glassmorphic search with keyboard-navigable suggestions |
| `Carousel` | Embla-powered carousel with keyboard support |
| `Tooltip` | Hover tooltip with 4 placement options |
| `ShaderAnimation` | Holographic foil card effect overlay |
| `Breadcrumbs` | Schema.org-marked breadcrumb nav — framework-agnostic |

## Installation

```bash
pnpm add arcane-vault-ui
```

## Tailwind v4 Setup

In your app's global CSS file:

```css
@import 'tailwindcss';
@import 'arcane-vault-ui/styles';

/* Tell Tailwind to scan the package for class names */
@source "../node_modules/arcane-vault-ui/dist";
```

## Usage

```tsx
import {
  Button,
  VaultBadge,
  Card, CardHeader, CardTitle, CardContent,
  useToast,
  Toaster,
} from 'arcane-vault-ui';

export function ProductCard() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <>
      <Card vault hoverable className="w-72">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Black Lotus</CardTitle>
            <VaultBadge variant="gold">Alpha</VaultBadge>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="vault"
            fullWidth
            onClick={() => addToast('Added to cart!', 'success')}
          >
            Add to Cart
          </Button>
        </CardContent>
      </Card>

      <Toaster toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

## Breadcrumbs with Next.js Link

```tsx
import Link from 'next/link';
import { Breadcrumbs } from 'arcane-vault-ui';

<Breadcrumbs
  items={[
    { name: 'Home', href: '/' },
    { name: 'Singles', href: '/singles' },
    { name: 'Black Lotus', href: '/singles/black-lotus', current: true },
  ]}
  LinkComponent={Link}
  baseUrl="https://hydracollect.com"
/>
```

## Design Tokens

Import tokens for programmatic use:

```ts
import { colors, typography, shadows, zIndex } from 'arcane-vault-ui';

colors.brand.primary  // '#148a81'
colors.vault.teal     // 'oklch(0.65 0.18 175)'
shadows.vaultGlow     // '0 0 20px rgba(20, 184, 166, 0.15)...'
```

## Storybook

```bash
pnpm storybook
```

## Development

```bash
pnpm dev        # Watch mode — rebuilds on change
pnpm build      # Production build to dist/
pnpm type-check # TypeScript validation
```
