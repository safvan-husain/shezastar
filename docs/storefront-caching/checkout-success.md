# Checkout Success (`/checkout/success`)

## What users expect

- Clear confirmation immediately
- Optional order details may depend on runtime inputs (cookies, `searchParams`)

## Best default: PPR with a static confirmation + dynamic details

### With Cache Components (PPR)

**Static shell**:
- Success headline, “Continue shopping” CTA, static help text

**Dynamic details (Suspense)**:
- If you read `searchParams` (e.g. `session_id`, `order_id`) the route is dynamic and that work must be behind `<Suspense>`.
- Fetching “latest order” by user cookie is also runtime-dependent.

**Caching**:
- Avoid shared `use cache` for order confirmation details (user-specific).
- If needed, use `'use cache: private'` for short-lived caching of the “last order summary”.

### Without Cache Components

- Typically SSR/dynamic due to `searchParams` and/or session cookies.
- Keep shared marketing blocks cached, but order data must remain per-user.

## ISR vs SSR tradeoffs

- **ISR is not appropriate** if the content is tied to a specific user/order query param.
- **PPR** keeps UX snappy: users see the success message instantly, and details stream in.

## Pitfalls

- Don’t cache order success pages across users.
- Surface payment provider/API errors clearly (toast + details) if order lookup fails.

