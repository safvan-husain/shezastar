---
inclusion: fileMatch
fileMatchPattern: 'app/**/*'
---

# Frontend Architecture & UI Rules

This document defines frontend-specific rules for Next.js 16 with Cache Components and server-action-driven flows.

---

## 🎨 Next.js 16 with Cache Components

**Key Principles:**
- **Dynamic by default**: All pages are dynamic unless explicitly cached.
- **Use `use cache` directive**: Cache components/functions that don't need runtime data.
- **Suspense boundaries**: Wrap dynamic content in `<Suspense>` for streaming.
- **Server Components first**: Prefer Server Components; use Client Components only when required.

---

## 🔄 Runtime APIs and Suspense

When using runtime APIs like `searchParams` or `params`, pass them as promises to child components wrapped in Suspense:

```tsx
// ✅ Pass promise to child wrapped in Suspense
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  return (
    <Suspense fallback={<Loading />}>
      <Content pagePromise={searchParams.then((p) => p.page)} />
    </Suspense>
  )
}

async function Content({ pagePromise }: { pagePromise: Promise<string | undefined> }) {
  const page = await pagePromise
  // Use page...
}
```

---

## 💾 Caching Strategy

### **Cache Static Data with cacheLife**

```ts
import { cacheLife } from 'next/cache'
import { getProducts } from '@/lib/queries/product.queries'

export const getCachedProducts = async () => {
  'use cache'
  cacheLife('hours')
  return getProducts()
}
```

### **Revalidation with Tags**

```ts
// Tag cached data
import { cacheTag, revalidateTag } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheTag('products')
  // Prisma read...
}

// Revalidate after mutations (server action)
import { createProduct } from '@/lib/services/product.service'

export async function createProductAction(formData: FormData) {
  'use server'
  // validate with Zod, call service
  await createProduct(...)
  revalidateTag('products')
  return { success: true }
}
```

---

## 🖥️ Client Components

Use `"use client"` only when needed:

**Use Client Components for:**
- User interactions (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, etc.)
- Third-party libraries requiring client-side.

**Example:**

```tsx
'use client'

import { useActionState } from 'react'
import { loginAction } from '@/lib/actions/auth.actions'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <form action={formAction}>
      {/* form fields */}
      <button type="submit" disabled={isPending}>Login</button>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
    </form>
  )
}
```

---

## 🧩 Component & Folder Structure

```
app/
  (auth)/
    login/
      page.tsx
    register/
      page.tsx
  (admin)/
    dashboard/
      page.tsx
    products/
      page.tsx
  products/
    page.tsx
    [id]/
      page.tsx
  components/
    ProductCard.tsx

components/            # Shared components
  ui/
    Button.tsx
    Input.tsx
  forms/
    LoginForm.tsx
```

---

## 📝 Server Actions in Forms (No API Routes)

Place all mutations in Server Actions and bind them directly to forms:

```ts
// lib/actions/product.actions.ts
'use server'

import { revalidateTag } from 'next/cache'
import { CreateProductSchema } from '@/lib/validations/product.schema'
import { createProduct } from '@/lib/services/product.service'

export async function createProductAction(formData: FormData) {
  const parsed = CreateProductSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  await createProduct(parsed.data)
  revalidateTag('products')
  return { success: true }
}
```

```tsx
// app/products/components/ProductForm.tsx
'use client'

import { useActionState } from 'react'
import { createProductAction } from '@/lib/actions/product.actions'

export function ProductForm() {
  const [state, formAction, isPending] = useActionState(createProductAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <input name="name" required />
      <input name="price" type="number" required />
      <button type="submit" disabled={isPending}>Create</button>
      {state?.error && <pre>{JSON.stringify(state.error, null, 2)}</pre>}
    </form>
  )
}
```

---

## 🧠 UI Design Guidelines

- **Design tokens first**: centralize colors, spacing, radii, shadows, typography scales; expose via CSS variables and/or Tailwind theme.
- **Typography**: choose a purposeful family (avoid default system stack); establish clear hierarchy (display/headline/label/caption) with consistent letter-spacing and line-height.
- **Color & contrast**: ensure WCAG AA for text; provide light/dark tokens if needed; reserve accent colors for actions and feedback.
- **States & feedback**: define hover/active/focus/disabled/loading states for all interactive elements; show inline validation + toasts for mutations; optimistic UI only when safe.
- **Layouts**: use grid/flex with deliberate spacing; avoid edge-to-edge text; keep max-widths for readability.
- **Motion**: purposeful micro-interactions (ease-in-out 150–250ms); add staggered reveals for lists/cards; prefer CSS transitions over JS when possible; respect “prefers-reduced-motion”.
- **Accessibility**: label form controls, manage focus, use semantic elements, support keyboard navigation, and announce async outcomes where applicable.
- **Forms**: surface field-level errors + summary; show pending states; prevent double-submit; reuse shared components for inputs/selects/buttons.
- **Empty/loading/error states**: design distinct visuals for each; use skeletons for predictable shapes, spinners for unknown durations.

---

## ✅ Frontend Rules

* Use Cache Components where appropriate; wrap dynamic content in Suspense.
* Server Components by default; Client Components only when needed.
* Use `'use server'` for all Server Actions; no API routes.
* Use `cache()` / `use cache` for query deduplication and caching.
* Always revalidate cache after mutations (`revalidateTag`/`revalidatePath`).
* Propagate validation errors back to the UI with readable messages.
* Keep UI consistent with shared design tokens and states.
