# Frontend & UI

## Error Handling & Toasts
- Always surface API errors via `useToast()` in client components; include `status`, full `body`, `url`, `method`.
- Use friendly messages; never silently fail or only log. Success mutations should show success toasts.
- Server components fetching data should return error objects and delegate to a client `ErrorHandler` that triggers the toast.

## Next.js 16 + Cache Components (from docs)
- Enable `cacheComponents: true` in `next.config.ts` before using `use cache`.
- Add `'use cache'` at file/component/function scope to cache the output; arguments and captured values become the cache key.
- Avoid `cookies()/headers()/searchParams` inside cached scopes—read them outside and pass values in.
- Use Suspense for dynamic sections; prefer Server Components and mark Client Components only when interactivity/hooks/browser APIs are required.
- When using runtime APIs (`params`, `searchParams`), pass promises to children and resolve inside Suspense-wrapped components.

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
