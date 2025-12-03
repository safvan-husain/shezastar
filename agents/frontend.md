# Frontend & UI

## Error Handling & Toasts
- Always surface API errors via `useToast()` in client components; include `status`, full `body`, `url`, `method`.
- Use friendly messages; never silently fail or only log. Success mutations should show success toasts.
- Server components fetching data should return error objects and delegate to a client `ErrorHandler` that triggers the toast.

## Confirmation Dialogs
- Never use browser `confirm()` or `alert()`. Use `ConfirmDialog` from `@/components/ui/ConfirmDialog`.
- Track confirming item with state, pass to dialog with `isOpen={Boolean(confirmingItem)}`, `title`, `message`, `variant` ('danger'|'primary'), and `isLoading`.

## Next.js 16 + Cache Components (from docs)
- Enable `cacheComponents: true` in `next.config.ts` before using `use cache`.
- Add `'use cache'` at file/component/function scope to cache the output; arguments and captured values become the cache key.
- Avoid `cookies()/headers()/searchParams` inside cached scopes—read them outside and pass values in.
- Use Suspense for dynamic sections; prefer Server Components and mark Client Components only when interactivity/hooks/browser APIs are required.
- When using runtime APIs (`params`, `searchParams`), pass promises to children and resolve inside Suspense-wrapped components.
- **Route params are promises.** Type page props as `interface PageProps { params: Promise<{ slug: string }> }` (same for `searchParams`) and `await params` inside the server component before reading values. Never assume synchronous objects; doing so leads to runtime failures in Next.js 16.

### Canonical cache snippet (latest docs)
```tsx
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

```tsx
// app/components/bookings.tsx
import { cacheLife, cacheTag } from 'next/cache'

export async function Bookings({ type = 'haircut' }: { type: string }) {
  'use cache'
  cacheLife('hours')      // built-in profile
  cacheTag('bookings')    // enables on-demand revalidation

  const res = await fetch(`/api/bookings?type=${encodeURIComponent(type)}`)
  return res
}
```

```tsx
// app/actions.ts (Server Action)
'use server'
import { updateTag } from 'next/cache'

export async function updateBooking(id: string, data: any) {
  await db.bookings.update(id, data)
  updateTag('bookings') // invalidates cached bookings everywhere
}
```

## Client vs Server Patterns
- Client components: interactivity, browser APIs, third-party libs needing the client.
- Server actions: keep mutations in `lib/actions/*.actions.ts` and revalidate tags after success.
- Forms can post to server actions with `<form action={...}>`.

## UI Structure
- Page-specific components live under `app/<route>/components/`; shared UI in `components/`.
- Example app groups: `(auth)/login`, `(admin)/dashboard`, `products/[id]`, etc.

## What to Reference
- For API shapes or domain rules, see `agents/backend.md`.
- For tests, see `agents/testing.md`.

## Theme & Color System
- **Storefront**: ALWAYS LIGHT MODE ONLY. Use `--storefront-*` CSS variables exclusively. No dark mode support.
- **Admin**: Support both light and dark mode using standard `--bg-*`, `--text-*`, `--border-*` variables.
- Use CSS variables for all colors (no hard-coded hex in components).
- Keep the palette grayscale-only; use contextual accent colors sparingly and define them per-feature, not globally.

### Storefront Color System (Light Mode Only)
The storefront uses a dedicated color system that remains light regardless of system preferences. All storefront components MUST use these variables:

**Backgrounds:**
- `--storefront-bg`: `#ffffff` (card/product backgrounds)
- `--storefront-bg-subtle`: `#f9fafb` (image placeholders, subtle sections)
- `--storefront-bg-hover`: `#f3f4f6` (hover states)

**Text:**
- `--storefront-text-primary`: `#111827` (product names, prices)
- `--storefront-text-secondary`: `#6b7280` (descriptions, labels)
- `--storefront-text-muted`: `#9ca3af` (meta info, placeholders)

**Borders:**
- `--storefront-border`: `#e5e7eb` (card borders, dividers)
- `--storefront-border-light`: `#f3f4f6` (subtle separators)

**Buttons:**
- `--storefront-button-primary`: `#111827` (cart button, primary actions)
- `--storefront-button-primary-hover`: `#1f2937`
- `--storefront-button-secondary`: `#ffffff` (wishlist, compare buttons)
- `--storefront-button-secondary-hover`: `#f9fafb`

**Sale/Pricing:**
- `--storefront-sale`: `#dc2626` (sale badges, discount prices)
- `--storefront-sale-bg`: `#fee2e2` (sale badge backgrounds)
- `--storefront-sale-text`: `#991b1b` (sale text on light backgrounds)

**Shadows:**
- `--storefront-shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `--storefront-shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- `--storefront-shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1)`

**Image Indicators:**
- `--storefront-indicator`: `rgba(0, 0, 0, 0.2)` (inactive dots)
- `--storefront-indicator-active`: `#111827` (active dot)

**Usage Rules:**
- Never use `--bg-*`, `--text-*`, or `--border-*` in storefront components
- Never add dark mode overrides for `--storefront-*` variables
- All storefront pages/components should use these dedicated variables
- Admin components should NOT use `--storefront-*` variables

### Light Mode (Base Grays)
- Backgrounds:
  - `--bg-base`: `#FFFFFF` (page background)
  - `--bg-subtle`: `#F5F5F5` (cards, secondary sections)
  - `--bg-elevated`: `#FAFAFA` (modals, popovers)
- Borders & Dividers:
  - `--border-subtle`: `#E5E5E5`
  - `--border-strong`: `#D4D4D4`
- Text:
  - `--text-primary`: `#111827` (main body text)
  - `--text-secondary`: `#4B5563` (secondary labels, help text)
  - `--text-muted`: `#9CA3AF` (placeholders, meta)
  - `--text-inverted`: `#F9FAFB` (text on dark surfaces)

### Dark Mode (Base Grays)
- Backgrounds:
  - `--bg-base`: `#020617` (page background)
  - `--bg-subtle`: `#020617` (cards, secondary sections)
  - `--bg-elevated`: `#020617` (modals, popovers)
- Borders & Dividers:
  - `--border-subtle`: `#1F2937`
  - `--border-strong`: `#374151`
- Text:
  - `--text-primary`: `#F9FAFB`
  - `--text-secondary`: `#D1D5DB`
  - `--text-muted`: `#6B7280`
  - `--text-inverted`: `#020617`

### Components & States
- Buttons:
  - Default/primary: use feature-specific accent for `background` with `--text-inverted` for label; keep border using `--border-strong` or transparent.
  - Secondary/ghost: use transparent or `--bg-subtle` background with `--border-subtle`; on hover, darken/lighten background by one step (subtle → elevated).
- Inputs:
  - Background: `--bg-subtle`, border: `--border-subtle`, text: `--text-primary`, placeholder: `--text-muted`.
  - Focus state: use `--border-strong` plus a 1px inner or 2px outer focus ring using an accent color; never rely on color alone (also change border thickness or shadow).
- Surfaces:
  - Cards and panels use `--bg-subtle` with `--border-subtle`; elevated content (modals, dropdowns) adds a soft shadow instead of thicker borders.

### Borders, Radius, and Shadows
- Border radius:
  - Use a small set of radii: `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`.
  - Default UI elements (buttons, inputs, tags) use `--radius-md`; small pills or badges can use `--radius-lg`.
- Shadows:
  - Base elevation: `--shadow-sm: 0 1px 2px rgba(0,0,0,0.06)`
  - Elevated: `--shadow-md: 0 4px 10px rgba(0,0,0,0.12)`
  - Avoid heavy/glowy shadows; keep them subtle and consistent across light/dark.

### Typography
- Use a minimal type scale, e.g., `--font-size-xs`, `--font-size-sm`, `--font-size-md`, `--font-size-lg`, `--font-size-xl`.
- Body text: `--font-size-md` with `--text-primary`; secondary labels and helper text: `--font-size-sm` with `--text-secondary`.
- Headings should not rely on color alone to indicate hierarchy; use size/weight differences and spacing.

### Contextual Colors
- For semantic states (success, warning, error, info), define contextual accent tokens per domain (e.g., booking, payments) under `components` or `lib` as needed.
- Always provide accessible contrast against both `--bg-base` and `--bg-subtle`; fall back to grayscale emphasis (bold, underline, borders) if color contrast is borderline.
