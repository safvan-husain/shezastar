# Checkout Cancel (`/checkout/cancel`)

## What users expect

- Immediate “payment canceled” messaging
- Optional contextual detail (why canceled, retry link) may use runtime query params

## Best default: static shell + dynamic context

### With Cache Components (PPR)

**Static shell**:
- Cancel message, “Try again” / “Return to cart” links

**Dynamic context (Suspense)**:
- If you read `searchParams` from the payment provider, do so inside a Suspense-wrapped component.

**Caching**:
- Usually no caching needed; the page can be static except for optional runtime messaging.
- Avoid shared `use cache` with runtime inputs.

### Without Cache Components

- Often SSR/dynamic if you use `searchParams`.
- If you don’t use runtime params, it can be static.

## ISR vs SSR tradeoffs

- **Static** is best when possible.
- **SSR** only if you must read runtime inputs; isolate them when using PPR.

## Pitfalls

- Don’t swallow provider errors; show full details via toast when debugging cancellations.

