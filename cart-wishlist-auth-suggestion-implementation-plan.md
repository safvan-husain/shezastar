# Cart + Wishlist Auth Suggestion Implementation Plan

## 1. Purpose and Scope
- Keep existing guest cart and wishlist behavior fully functional.
- After a **successful add-to-cart** or **successful add-to-wishlist**, gently suggest signing in or creating an account to sync items across devices/timeline.
- The suggestion is **optional** (never blocks the add), **shown once per browser session**, and shown again on a new browser session or after the user logs out and becomes a guest again.
- Cart and wishlist pages should also show a lightweight “you’re browsing as guest” message near the top when the user isn’t authenticated.

---

## 2. Backend Plan

### 2.1 Confirm Existing Guest → User Sync
- Current auth routes already merge guest data on login/register:
  - `app/api/auth/login/route.ts` calls `mergeCarts(session.sessionId, user.id)` and `mergeWishlists(...)`.
  - `app/api/auth/register/route.ts` does the same for newly created accounts.
- No new merge logic is required, but this behavior should remain an explicit dependency for the UX nudge.

### 2.2 Make Storefront Session Auth State Observable to Clients
The client needs a reliable way to detect “guest vs logged-in” to decide whether to show the suggestion.  
Currently, the session model includes `userId`, but the API response schema strips it.

- Update schema:
  - `lib/storefront-session/storefront-session.schema.ts`
    - Add `userId: z.string().optional()` to `StorefrontSessionSchema`.
    - Keep it optional so guest sessions remain valid.
- Result:
  - `GET /api/storefront/session` and `POST /api/storefront/session` will return `userId` when the session is bound to a user.
  - Client-side providers (`StorefrontSessionProvider`, `NavbarWrapper`, cart/wishlist providers) can safely rely on `session.userId`.

### 2.3 Optional (Not Required) Server-Driven Hint
If later desired, add a server-side hint in mutation responses:
- `POST /api/storefront/cart` and `POST /api/storefront/wishlist` could include `shouldSuggestAuth: boolean` when `!session.userId`.
- This is optional; the baseline plan keeps suggestion purely client-driven to avoid coupling API shapes.

---

## 3. Backend Tests (Unit + Integration)

### 3.1 Unit Tests
- `test/unit/storefront-session.controller.test.ts`
  - Add a case where `ensureStorefrontSession` resolves a session with `userId`.
  - Assert `handleEnsureStorefrontSession(...)` returns `status: 200` and includes `userId` in `body`.
- `test/unit/storefront-session.service.test.ts`
  - Add/extend a test for `bindSessionToUser(sessionId, userId)` ensuring:
    - The stored session document includes `userId`.
    - `getStorefrontSession()` returns a DTO with `userId` present.

### 3.2 Integration Tests
- `test/integration/storefront-session.test.ts`
  - After a guest `POST`/`GET`, assert `userId` is `undefined` (guest).
  - After binding via login/register (see next bullet), assert `userId` is defined.
- `test/integration/auth-flow.test.ts`
  - After successful `LoginPOST(...)`, call `GET /api/storefront/session` and assert:
    - response `status === 200`
    - `body.userId` matches the logged-in user.
  - After `LogoutPOST(...)`, call session `GET` again and assert `userId` is absent (guest again).

---

## 4. Frontend Plan (UX/UI)

### 4.1 Auth Suggestion State and Reset Rules
- Implement a small client utility or provider (suggested location: `components/storefront/StorefrontAuthSuggestionProvider.tsx`) that exposes:
  - `suggestAuthIfGuest(trigger: 'cart' | 'wishlist')`
  - Internally checks:
    - `session.userId` (from `useStorefrontSession()`).
    - A “shown this browser session” flag.
- “Shown once per browser open” behavior:
  - Use `sessionStorage.setItem('authSuggestionShown', 'true')` after first show.
  - Read on load to suppress future shows in that tab.
  - Clear this key on logout success so a guest can see the suggestion again without reopening the browser.
  - Note: sessionStorage is per-tab; this matches “browser open” closely enough and avoids persistent nags.

### 4.2 Suggestion UI Component
- Create a storefront-styled modal/drawer (suggested location: `components/storefront/AuthSuggestionModal.tsx`):
  - Copy example:
    - Title: “Save your cart and wishlist across devices”
    - Body: “Sign in or create an account to keep these items on your timeline.”
  - CTAs:
    - Primary: **Sign in** → `/account`
    - Secondary: **Create account** → `/account/register`
    - Tertiary: **Continue as guest** (closes modal)
- Implementation notes:
  - Reuse existing dialog/modal primitives if present; do not use `alert()`/`confirm()`.
  - Use storefront CSS variables only (`--storefront-*`).
  - Do not show on error; only after a successful add mutation.

### 4.3 Trigger After Successful “Add to Cart”
- `components/storefront/StorefrontCartProvider.tsx`
  - Wrap `addToCart` so that after `mutateCart('POST', ...)` resolves successfully:
    - Call `suggestAuthIfGuest('cart')`.
  - Ensure no changes to update/remove/clear flows.

### 4.4 Trigger After Successful “Add to Wishlist”
- `components/storefront/StorefrontWishlistProvider.tsx`
  - In `toggleWishlistItem`:
    - Only when `alreadyInWishlist === false` and the `POST` succeeds:
      - Call `suggestAuthIfGuest('wishlist')`.
    - Do not show on remove (`DELETE`) or on API failure.

### 4.5 Guest Banner on Cart and Wishlist Pages
- Add a reusable banner component (suggested location: `components/storefront/GuestAuthBanner.tsx`) that:
  - Uses `useStorefrontSession()` and shows only when `!session.userId`.
  - Example text:
    - “You’re shopping as a guest. Sign in to sync your cart and wishlist across devices.”
    - Inline links to `/account` and `/account/register`.
- Place it:
  - Cart: top of `app/(store)/cart/components/CartPageContent.tsx` (client component).
  - Wishlist: add a small client wrapper or insert the banner into `components/ProductGrid.tsx` when rendered on wishlist, or create `app/(store)/wishlist/components/WishlistPageContent.tsx` as a client component that renders the banner + grid.

### 4.6 Logout Reset Hook
- Wherever logout is triggered in storefront UI (Navbar/account area):
  - After logout success, clear `sessionStorage.removeItem('authSuggestionShown')`.
  - Also call `refreshSession()` so providers update to guest state.

### 4.7 Analytics (Optional)
- Track:
  - `auth_suggestion_shown` with trigger source (`cart`/`wishlist`).
  - `auth_suggestion_clicked_login` / `..._register`.
  - Downstream conversion to login/register and checkout.
- Use this to A/B copy and trigger timing if needed.

