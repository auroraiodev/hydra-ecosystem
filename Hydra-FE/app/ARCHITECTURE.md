# Architecture Guide

This document defines the architectural principles and folder structure for the project.

## Folder Structure (Feature-Based Architecture)

The project follows a **Feature-Sliced Design (FSD)** inspired architecture, organized by business domain rather than technical type.

```
hydra-fe/
├── app/                      # App Layer (Next.js App Router)
│   ├── (auth)/              # Route groups for logical organization
│   ├── (marketplace)/       # Main store routes
│   ├── layout.tsx           # Global layout & root providers
│   ├── page.tsx             # Home page composition
│   └── globals.css          # Global styles & Tailwind tokens
├── features/                 # Business Logic Layers
│   ├── auth/                # Authentication feature
│   │   ├── components/      # Feature-specific components (e.g. LoginForm)
│   │   ├── hooks/           # Business logic hooks (e.g. useAuth)
│   │   └── types/           # Domain types
│   ├── products/            # Catalog, wishlist, recently viewed
│   ├── orders/              # Checkout, history, tracking
│   ├── navigation/          # Navbar, Sidebar, Footer
│   ├── notifications/       # Toast, Push, In-app alerts
│   ├── shared/              # Shared Layer (Cross-feature logic)
│   │   ├── components/      # Shared compositions (e.g. ToastProvider)
│   │   ├── ui/              # UI Kit (Primitives like Button, Input)
│   │   ├── hooks/           # Generic hooks (e.g. useDebounce)
│   │   └── utils/           # Shared helper functions
│   └── ...                  # Other domain features (chat, reviews, etc.)
├── lib/                      # Infrastructure & Utilities
│   ├── api/                 # API clients & domain-specific fetching
│   ├── store/               # Redux Toolkit setup & global slices
│   ├── types/               # Global/shared TypeScript definitions
│   └── utils/               # Pure utility functions (no React dependency)
├── public/                   # Static assets (images, fonts, robots.txt)
└── scripts/                  # Build/deployment helper scripts
```

## Architecture Principles

### 1. Component Organization

#### Shared Components (`components/`)

- **UI Components** (`components/ui/`): Primitive, reusable UI components
  - Should be pure, presentational components
  - No business logic
  - Accept props, render UI
  - Use forwardRef for ref forwarding
  - Export via barrel file (`index.ts`)

- **Layout Components** (`components/layout/`): Page layout components
  - Header, Navbar, Footer, etc.
  - Used across multiple pages

- **Form Components** (`components/forms/`): Complex form components
  - Multi-field forms
  - Form validation components

#### Page Components (`app/*/components/`)

- Components specific to a single page/route
- Not shared across routes

### 2. State Management

- **Redux Toolkit** for global state
- **React useState/useReducer** for local component state
- **React Context** only for theme/provider patterns

Store structure:

```
lib/store/
├── slices/          # Feature-based slices
├── hooks.ts         # Typed hooks
└── store.ts         # Store configuration
```

### 3. Separation of Concerns

#### Components (`components/`)

- **Pure UI components only** - no business logic
- Presentational components that accept props and render UI
- No API calls, no state management (except local UI state)
- No utility functions embedded in components

#### Hooks (`hooks/`)

- **Reusable business logic** extracted from components
- Custom hooks that encapsulate stateful logic
- Can use other hooks, API calls, and Redux
- Examples: `useAuth`, `useForm`, etc.

#### Libraries (`lib/`)

- **API Layer** (`lib/api/`): All API calls organized by feature/domain
  - Separate files for each API domain (auth, users, products, etc.)
  - Pure functions that make HTTP requests
  - Consistent error handling
  - Type-safe request/response interfaces

- **Types** (`lib/types/`): All TypeScript type definitions
  - Separated from implementation files
  - Organized by domain (api.ts, user.ts, product.ts, etc.)
  - Shared across the application

- **Constants** (`lib/constants/`): Application constants
  - API URLs, configuration values
  - Magic numbers and strings
  - Environment-specific values

- **Utils** (`lib/utils/`): Pure utility functions
  - Formatting functions (formatDate, formatCurrency)
  - Validation functions (validateEmail, validatePassword)
  - Helper functions (debounce, throttle, etc.)
  - No side effects, no dependencies on React

### 4. Type Safety

- All components, functions, and utilities should be typed
- Shared types in `lib/types/` - **never inline types in components**
- Use TypeScript strict mode
- Prefer interfaces for object shapes
- Types are separated from implementation for reusability

### 5. Styling

- **Tailwind CSS** for styling
- Use design tokens (colors, spacing) from `tailwind.config.ts`
- Responsive design with mobile-first approach

### 6. File Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`, `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types/Interfaces**: PascalCase (e.g., `User.ts`, `ApiResponse.ts`)

### 7. Import Rules

- Use absolute imports with `@/` alias
- Barrel exports (`index.ts`) for component folders
- Group imports: external → internal → relative
- Order: React → Next.js → Third-party → Local

Example:

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoMailOutline } from 'react-icons/io5';

import { Button, Input } from '@/components/ui';
import { useAuth } from '@/features/auth';
import type { LoginRequest } from '@/lib/types';
```

### 8. Component Structure

```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export
```

Example:

```typescript
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, ...props }, ref) => {
    return (
      <button ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 9. Code Organization Rules

1. **Single Responsibility**: Each component/function should do one thing
2. **DRY (Don't Repeat Yourself)**: Extract shared logic to utilities/hooks
3. **Composition over Inheritance**: Build complex components from simple ones
4. **Separation of Concerns**: Business logic separate from UI
5. **Consistency**: Follow established patterns across the codebase

### 10. Testing Structure (Future)

```
__tests__/
├── components/
├── lib/
└── app/
```

## Migration Guide

When adding new features, follow this decision tree:

1. **Does it belong to a specific domain (e.g. Auth, Checkout)?**
   - → Create or use the corresponding folder in `features/[domain]/`
   - UI specific to that feature → `features/[domain]/components/`
   - Business logic → `features/[domain]/hooks/`

2. **Is it a generic UI primitive (e.g. Button, Input, Modal)?**
   - → `features/shared/ui/`

3. **Is it a shared composition used by multiple features?**
   - → `features/shared/components/`

4. **Is it reusable logic (Hook or Util)?**
   - Feature-specific → `features/[domain]/hooks/`
   - Generic & uses React → `features/shared/hooks/`
   - Generic & pure JS/TS → `lib/utils/`

5. **Is it an API call?**
   - → `lib/api/[domain].ts` (e.g., `lib/api/auth.ts`)

6. **Is it a type definition?**
   - Feature-specific → `features/[domain]/types/`
   - Global/Shared → `lib/types/` or `features/shared/types/`

## Key Principles

### Component vs Hook vs Utility

- **Component**: Renders UI, accepts props, no business logic
- **Hook**: Reusable stateful logic, can use other hooks, API calls, Redux
- **Utility**: Pure function, no side effects, no React dependencies

### Example: Authentication Flow

```typescript
// lib/types/api.ts - Types separated
export interface LoginRequest { ... }
export interface LoginResponse { ... }

// lib/constants/api.ts - Constants separated
export const API_URL = '...';

// lib/api/auth.ts - API functions separated
export async function login(credentials: LoginRequest): Promise<LoginResponse> { ... }

// features/auth/hooks/useAuth.ts - Business logic in hook
export function useAuth() {
  const { login: loginApi } = useApi();
  const dispatch = useAppDispatch();
  // ... logic
  return { login, logout, user, isAuthenticated };
}

// components/LoginForm.tsx - Pure UI component
export function LoginForm() {
  const { login, isLoading } = useAuth();
  // ... render UI
}
```

## Best Practices

1. **Separation of Concerns**
   - Components: UI only, no business logic
   - Hooks: Reusable stateful logic
   - Utils: Pure functions, no side effects
   - Types: Separate from implementation
   - Constants: Centralized configuration

2. **Reusability**
   - Always use shared components when they exist
   - Extract common logic to hooks or utils
   - Create new shared components when duplicating UI code
   - Share types across the application

3. **Code Organization**
   - Keep components small and focused
   - One responsibility per file
   - Use barrel exports (`index.ts`) for clean imports
   - Group related functionality together

4. **Type Safety**
   - Use TypeScript strictly - avoid `any`
   - Types in `lib/types/`, not inline in components
   - Use interfaces for object shapes
   - Export types for reuse

5. **Performance**
   - Optimize for performance (use React.memo, useMemo when needed)
   - Lazy load non-critical components
   - Use code splitting for routes

6. **Accessibility**
   - Follow accessibility guidelines (ARIA labels, keyboard navigation)
   - Use semantic HTML
   - Test with screen readers

7. **Documentation**
   - Document complex logic with comments
   - Use meaningful names for variables and functions
   - Keep architecture documentation up to date
