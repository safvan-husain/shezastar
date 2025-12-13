# Register (`/account/register`)

## What users expect

- Fast form display
- Correct validation feedback on submit

## Best default: fully static shell

This page is usually just a form and can be almost entirely prerendered.

### With Cache Components (PPR)

- The whole page can be included in the static shell.
- Submission should be via Server Action or API route; keep mutations uncached.

### Without Cache Components

- This can be statically rendered (no runtime APIs required).

## ISR vs SSR tradeoffs

- **Static** is best; **ISR** is unnecessary unless the form content itself is CMS-driven.
- **SSR** is only needed if you must inspect runtime request data to decide what to show (generally avoid for registration).

## Pitfalls

- Don’t hide server-side validation failures; surface them to the user and toast full error details for debugging.

### Review
go with static.

