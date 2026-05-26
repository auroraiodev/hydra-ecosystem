# Hydra FE — Future Roadmap & Advanced Improvements

This document outlines the next stages of development for the Hydra Frontend, focusing on advanced performance, reliability, and conversion optimization.

---

## Phase 4: Performance & SEO (The "Ultra-Fast" Phase)

### ~~4.1 Dynamic Open Graph Generation (P1)~~ ✅ FIXED

**Goal:** Improve Social Media CTR (Click-Through Rate).
Currently, product sharing uses generic meta tags or static images.
**Action:** Implemented `/api/og` route using `@vercel/og` to generate dynamic images with card name, price, and expansion.

### ~~4.2 Manual Prefetching on Hover (P2)~~ ✅ FIXED

**Goal:** Achieve "zero-latency" feel.
**Action:** Created `PrefetchLink` component that triggers `router.prefetch()` on mouse enter with a 50ms debounce.

### ~~4.3 Image Delivery P2: Responsive `srcSet` (P2)~~ ✅ FIXED

**Goal:** Minimize mobile data usage.
**Action:** Standardized `sizes` attribute in `CardImage.tsx` to ensure proper image resolution across different screen sizes.

### ~~4.4 Font Optimization (P3)~~ ✅ FIXED

**Goal:** Reduce Layout Shift (CLS) on slow connections.
**Action:** Set `display: swap` for Inter font and improved preloading strategy.

---

## Phase 5: Reliability & Observability

### ~~5.1 Zod-Validated API Responses (P1)~~ ✅ FIXED

**Goal:** Prevent runtime crashes due to backend schema changes.
**Action:** Created Zod schemas in `lib/validations/` for Products and Cart. Implemented `safeParse` in API clients with automatic error logging.

### ~~5.2 Sentry & Error Tracking (P1)~~ ✅ FIXED

**Goal:** Catch production errors before users report them.
**Action:** Integrated `@sentry/nextjs`. Created configuration for client, server, and edge. Wrapped `next.config.ts` with `withSentryConfig`.

### ~~5.3 Standardized Logging Utility (P2)~~ ✅ FIXED

**Goal:** Uniform logging in Dev vs Prod.
**Action:** Created `lib/utils/logger.ts` with support for debug levels and conditional console output based on environment. Used across all API clients.

---

## Phase 6: UX & Conversion Optimization

### ~~6.1 Smart Search Autocomplete (P1)~~ ✅ FIXED

**Goal:** Reduce search friction.
**Action:** Implemented a real-time "Quick Search" list in `SearchModal.tsx` that displays top 5 card matches with icons while the user types.

### ~~6.2 Wishlist Sync & Price Alerts (P2)~~ ✅ PARTIAL

**Goal:** Bring users back to the site.
**Action:**

1. **Added Wishlist & Cart Counters**: Real-time badges in the Navbar for immediate user feedback.
2. **Recently Viewed Tracking**: Implemented `useRecentlyViewed` hook and UI section in Product Details to improve navigation and retention.
3. _Sync pending backend support for persistent storage._

### ~~6.3 Progressive Web App (PWA) Enhancements (P3)~~ ✅ FIXED

**Goal:** App-like feel on mobile.
**Action:**

- Converted `next.config.ts` to support `next-pwa`.
- Improved `manifest.json` with Spanish translations, branded colors (`slate-900`), and proper categories.
- Consolidated all build-time optimizations (Bundle Analyzer, PWA, Sentry) into a single TypeScript configuration.

---

## Phase 7: Developer Experience (DX)

### ~~7.1 Unified Component Library (Storybook) (P2)~~ ✅ FIXED

**Goal:** Stop reinventing components.
**Action:** Set up Storybook 8 with Next.js integration. Created initial stories for `Button`, `SearchInput`, and `EnhancedCard`.

### ~~7.2 Strict TypeScript Promotion (P2)~~ ✅ FIXED

**Goal:** Maintenance ease.
**Action:**

- Eliminated explicit `any` usage in core API layer (Cart, Product, Orders, Search, Listings, Autocomplete), middleware, and hooks.
- Refactored critical UI components (`SearchClient`, `QuickViewModal`, `VirtualProductGrid`, `SharedNavbar`) to use strictly typed `CardData`.
- Integrated Zod validation for runtime type safety.
- Ensured `strict: true` is enabled in `tsconfig.json`.

---

## Final Review & Recommended Next Steps

| Priority   | Task                         | Status      | Impact                                         |
| ---------- | ---------------------------- | ----------- | ---------------------------------------------- |
| **High**   | Finalize Backend Wishlist    | Pending     | Persistent data across devices                 |
| **Medium** | Service Worker Notifications | Planned     | Real-time price drop alerts                    |
| **Medium** | Component Documentation      | In Progress | Full Storybook coverage for all @ui components |
| **Low**    | Bundle Optimization Check    | Done        | Verified with Webpack Bundle Analyzer          |
