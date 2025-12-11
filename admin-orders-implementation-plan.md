# Admin Orders Management – Implementation Plan

## 1. Purpose and Scope
- Provide admins with a complete view of all orders created via the storefront/Stripe checkout flow.
- Allow admins to:
  - Browse all orders with server-side pagination.
  - Filter orders by status (`pending`, `paid`, `cancelled`, `failed`).
  - View a single order in detail (line items, amounts, metadata).
  - Update an order’s status from the admin panel.
- Reuse existing order domain logic so future clients (e.g., separate dashboards or APIs) can leverage the same services.

---

## 2. Backend Plan

### 2.1 Existing Data Model
- Orders are stored in the `orders` MongoDB collection, modeled in:
  - `lib/order/model/order.model.ts` (`OrderDocument`, `Order`, `OrderItem`, `OrderStatus`).
  - `lib/order/order.service.ts` (`createOrder`, `getOrderByStripeSessionId`, `updateOrderStatus`, `getOrdersBySessionId`).
- Orders are currently created from Stripe webhooks (`app/api/webhooks/route.ts`) and not directly exposed to the admin UI.
- `OrderStatus` is a string union: `'pending' | 'paid' | 'cancelled' | 'failed'`.

### 2.2 Indexes and Storage
- Continue using the existing `orders` collection.
- Ensure indexes support admin queries:
  - Keep existing indexes on:
    - `{ sessionId: 1 }`
    - `{ stripeSessionId: 1 }` (unique, sparse)
    - `{ createdAt: -1 }`
  - Add a compound index optimized for filtering and sorting:
    - `{ status: 1, createdAt: -1 }`
      - Improves queries for “all paid orders”, “latest pending orders”, etc.
- No structural changes are required to `OrderDocument`; only query patterns and indexes are extended.

### 2.3 Schemas and Types (`lib/order/order.schema.ts`)
- Extend the order schema module to support admin-facing operations:
  - Keep existing `OrderItemSchema` and `OrderSchema` for read DTOs.
  - Add an input schema for status updates:
    - `UpdateOrderStatusSchema`:
      - Shape: `{ status: z.enum(['pending', 'paid', 'cancelled', 'failed']) }`.
  - (Optional but recommended) Add a response schema for list endpoints:
    - `AdminOrderListResponseSchema`:
      - Shape:
        ```ts
        export const AdminOrderListResponseSchema = z.object({
          orders: z.array(OrderSchema),
          pagination: z.object({
            page: z.number().int().min(1),
            limit: z.number().int().min(1),
            total: z.number().int().min(0),
            totalPages: z.number().int().min(0),
          }),
        });
        ```
  - Export TS types via `z.infer`, e.g.:
    - `export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;`
    - `export type AdminOrderListResponse = z.infer<typeof AdminOrderListResponseSchema>;`
- (Optional) Add `lib/order/index.ts` to re-export `Order`, `OrderStatus`, and the new schema types for use in UI and tests.

### 2.4 Service Layer (`lib/order/order.service.ts`)
- Build admin-oriented service functions on top of the existing ones.

#### 2.4.1 Get Single Order by ID
- Add `getOrderById(id: string): Promise<Order>`:
  - Validate `id` is a valid `ObjectId`:
    - If invalid, throw `new AppError(400, 'INVALID_ORDER_ID', { id })`.
  - Query the collection by `_id`:
    - If not found, throw `new AppError(404, 'ORDER_NOT_FOUND', { id })`.
  - Map result via `toOrder(doc)` and return.

#### 2.4.2 List Orders with Pagination and Optional Status Filter
- Add:
  ```ts
  export async function listOrders(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  }): Promise<{ orders: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> { ... }
  ```
- Behavior:
  - Normalize inputs:
    - `page = Math.max(1, page ?? 1)`.
    - `limit = Math.min(Math.max(1, limit ?? 20), 100)` (cap to avoid huge responses).
  - Build Mongo filter:
    - `const filter: Partial<OrderDocument> = {};`
    - If `status` is provided, set `filter.status = status`.
  - Compute `total = await collection.countDocuments(filter)`.
  - Compute pagination:
    - `const totalPages = total === 0 ? 0 : Math.ceil(total / limit);`
    - `const skip = (page - 1) * limit;`
  - Query:
    - `find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()`.
  - Map docs to `Order[]` via `toOrder`.
  - Return `{ orders, pagination: { page, limit, total, totalPages } }`.

#### 2.4.3 Update Order Status by ID
- Add:
  ```ts
  export async function updateOrderStatusById(id: string, status: OrderStatus): Promise<Order> { ... }
  ```
- Behavior:
  - Validate `id` as in `getOrderById`; throw `INVALID_ORDER_ID` on bad format.
  - Optionally enforce transition rules:
    - For v1, allow all transitions (`pending` ↔ `paid` ↔ `cancelled` ↔ `failed`).
    - Document future option: disallow moving from `cancelled`/`failed` back to `paid` unless there is a compensating payment.
  - Use `findOneAndUpdate`:
    - Filter: `{ _id: new ObjectId(id) }`
    - Update: `{ $set: { status, updatedAt: now } }`
    - Options: `{ returnDocument: 'after' }`
  - If result is null, throw `new AppError(404, 'ORDER_NOT_FOUND', { id })`.
  - Return `toOrder(result)`.

### 2.5 Controller Layer (`lib/order/order.controller.ts`)
- Create a dedicated controller file for orders; follow patterns in `lib/app-settings/app-settings.controller.ts`.

#### 2.5.1 List Orders (Admin)
- Add:
  ```ts
  export async function handleAdminListOrders(
    page?: number,
    limit?: number,
    status?: string,
  ) { ... }
  ```
- Behavior:
  - In a `try` block:
    - Normalize `page`/`limit` (coerce to numbers if provided).
    - If `status` is provided:
      - Ensure it matches one of the known statuses (`pending`, `paid`, `cancelled`, `failed`).
      - If invalid, throw `new AppError(400, 'INVALID_STATUS', { status })`.
    - Call `listOrders({ page, limit, status: status as OrderStatus | undefined })`.
    - Return `{ status: 200, body: result }`.
  - In `catch`, return `catchError(err)` like other controllers.

#### 2.5.2 Get Single Order (Admin)
- Add:
  ```ts
  export async function handleAdminGetOrder(id: string) { ... }
  ```
- Behavior:
  - In `try`, call `getOrderById(id)` and return `{ status: 200, body: order }`.
  - Allow `AppError` to translate to appropriate HTTP status codes via `catchError`.

#### 2.5.3 Update Order Status (Admin)
- Add:
  ```ts
  export async function handleAdminUpdateOrderStatus(id: string, input: unknown) { ... }
  ```
- Behavior:
  - Parse `input` via `UpdateOrderStatusSchema`.
  - Call `updateOrderStatusById(id, parsed.status)`.
  - Return `{ status: 200, body: updatedOrder }` on success.
  - Use `catchError` to map validation and business errors to `{ status, body }`.

### 2.6 API Routes

#### 2.6.1 List Orders – `GET /api/admin/orders`
- Create `app/api/admin/orders/route.ts`:
  - Import `NextResponse` and `handleAdminListOrders`.
  - `GET(req: Request)`:
    - `const url = new URL(req.url);`
    - Read query params:
      - `const page = url.searchParams.get('page');`
      - `const limit = url.searchParams.get('limit');`
      - `const status = url.searchParams.get('status') || undefined;`
    - Coerce `page`/`limit` to numbers before passing or let controller accept `string | undefined` as inputs and coerce there.
    - Call `const { status: httpStatus, body } = await handleAdminListOrders(pageNumber, limitNumber, status);`
    - Return `NextResponse.json(body, { status: httpStatus });`
- Behavior:
  - Default `page=1`, `limit=20` when params are missing.
  - Allow `status` to be omitted (all orders) or one of the four values.

#### 2.6.2 Get / Update Single Order – `/api/admin/orders/[id]`
- Create `app/api/admin/orders/[id]/route.ts`:
  - Import `NextResponse`, `revalidatePath`, and controller functions.
  - Use Next.js 15+/16 async params:
    ```ts
    export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
      const { id } = await params;
      const { status, body } = await handleAdminGetOrder(id);
      return NextResponse.json(body, { status });
    }
    ```
  - For status updates:
    ```ts
    export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
      const { id } = await params;
      const payload = await req.json();
      const { status, body } = await handleAdminUpdateOrderStatus(id, payload);
      try {
        revalidatePath('/(admin)/orders', 'page');
        revalidatePath(`/(admin)/orders/${id}`, 'page');
      } catch {
        // Ignore revalidation errors in test environments
      }
      return NextResponse.json(body, { status });
    }
    ```
- All route handlers should avoid embedding business logic; they should only parse request data, call controllers, and return `NextResponse`.

### 2.7 Error Handling
- All backend errors must surface to the UI with full context (per `AGENTS.md` / `agents/frontend.md`):
  - Services throw `AppError` for invalid IDs, missing orders, invalid statuses, or illegal transitions.
  - Controllers convert `AppError` to `{ status, body: { code, message, details? } }`.
  - Routes return `NextResponse` with that status/body.
- The frontend uses this payload inside toasts so operators can see the full error information (`status`, `code`, raw body).

---

## 3. Frontend Plan (Admin UI)

### 3.1 UX and Navigation
- Add an “Orders” link to the admin navigation in `app/(admin)/layout.tsx`:
  - Place alongside existing links (Products, Categories, Variant Types, Settings).
  - Link path: `/orders` (within the `(admin)` group).
- Admin flows:
  1. Navigate to `/orders` to see a paginated, filterable list.
  2. Click a row to open `/orders/[id]` for details.
  3. Update the order’s status from the detail page.

### 3.2 Orders List Page – `app/(admin)/orders/page.tsx`

#### 3.2.1 Data Fetching
- Implement as an async server component:
  - Props:
    ```ts
    interface OrdersPageProps {
      searchParams: Promise<{ page?: string; status?: string }>;
    }
    ```
  - In the component:
    - `const { page = '1', status } = await searchParams;`
    - Call a helper `getOrders({ page, status })`.
- `getOrders` helper (local to the page):
  - Build the URL:
    - `const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';`
    - Include query params: `/api/admin/orders?page=${page}&status=${status ?? ''}` (omit `status` when undefined).
  - Perform a `fetch` with `cache: 'no-store'` to avoid stale data.
  - On success:
    - Parse JSON into `{ orders, pagination }`.
    - Return `{ orders, pagination, error: null }`.
  - On non-OK responses:
    - Attempt to parse JSON body; fall back to a generic error shape if parsing fails.
    - Return `error: ToastErrorPayload` with:
      - `message` (from body or a fallback like “Failed to load orders”).
      - `status`, `body`, `url`, `method: 'GET'`.
  - On network errors:
    - Return `error` with message and stack, as in `ProductsPage`.

#### 3.2.2 Rendering and Error Handling
- In the page:
  - If `error` exists, render:
    - `<ErrorToastHandler error={error} />`
    - A fallback `Card` similar to the “Unable to load products” card in `app/(admin)/products/page.tsx`.
  - If `orders.length === 0` and no error:
    - Render an empty-state card explaining that no orders exist or that filters removed them.
  - Otherwise:
    - Show a header section:
      - Title: “Orders”.
      - Subtitle: “Review and manage customer orders”.
      - Optional stats row (e.g. total orders, pending count) if the API later returns aggregated counts.

#### 3.2.3 Status Filter
- Add a client component `OrdersStatusFilter` under `app/(admin)/orders/components/OrdersStatusFilter.tsx`:
  - `'use client';`
  - Props:
    - `currentStatus?: string;`
    - `currentPage: number;`
  - Implementation:
    - Use `useRouter` and `useSearchParams` from `next/navigation`.
    - Render a `select` with options:
      - “All statuses” (no `status` query).
      - “Pending”, “Paid”, “Cancelled”, “Failed”.
    - On change:
      - Build a query string:
        - `status` set to the chosen value (or removed for “All”).
        - Reset `page` to `1` whenever the status changes.
      - Call `router.push` with the new URL (e.g., `/orders?status=pending&page=1`).
  - Styling:
    - Use admin color tokens (`--bg-subtle`, `--text-primary`, etc.) from `agents/frontend.md`.

#### 3.2.4 Orders Table and Pagination
- Display orders in a table or grid within a `Card`:
  - Columns:
    - Order ID (shortened, e.g., first 8 chars).
    - Created date/time (formatted).
    - Status pill with color coding (e.g., neutral for pending, green for paid, red/orange for cancelled/failed).
    - Item count (`order.items.length`).
    - Total amount + currency.
  - Each row should:
    - Be clickable or include a “View” link to `/orders/{order.id}`.
    - Use semantic table markup (`<table>`) or a flex grid, consistent with existing admin patterns.
- Pagination controls:
  - Use `pagination.page`, `pagination.totalPages` from the API.
  - Render “Previous” and “Next” buttons using `Link` or `router.push`:
    - Preserve the current `status` filter in the query string.
    - Disable/omit “Previous” when `page === 1`.
    - Disable/omit “Next” when `page >= totalPages`.
  - Optionally render page numbers when `totalPages` is small.

### 3.3 Order Detail Page – `app/(admin)/orders/[id]/page.tsx`

#### 3.3.1 Data Fetching
- Implement as an async server component:
  - Props:
    ```ts
    interface OrderDetailPageProps {
      params: Promise<{ id: string }>;
    }
    ```
  - Await params to get `id`:
    - `const { id } = await params;`
  - Use `getOrder(id)` helper:
    - Call `GET /api/admin/orders/${id}` with `cache: 'no-store'`.
    - On success: return `{ order, error: null }`.
    - On non-OK responses:
      - Parse body if possible.
      - Return `error: ToastErrorPayload` with `status`, `body`, `url`, `method: 'GET'`.
    - On network errors:
      - Return `error` with message and stack.

#### 3.3.2 Rendering
- In the page:
  - Always render `<ErrorToastHandler error={error} />` when `error` is non-null so toasts fire.
  - If `!order` and no error (e.g., 404 mapped to empty body):
    - Show “Order not found” message.
  - If `order` exists:
    - Breadcrumb navigation (similar to `EditProductPage`):
      - “Orders” → current order ID.
    - Header section:
      - Order ID (full or truncated).
      - Status pill (current status).
      - Created date/time.
      - Total amount + currency.
    - Details sections:
      - **Summary**: status, currency, created/updated timestamps, sessionId, stripeSessionId.
      - **Items**: table listing each `OrderItem`:
        - Product image (if present).
        - Product name.
        - Variant name (e.g., “Color: Red, Storage: 256GB”).
        - Quantity, unit price, line total.
      - **Status controls**:
        - Embed `OrderStatusUpdater` component (see below) to change status.

### 3.4 Status Update UI – `OrderStatusUpdater`

- Add a client component `OrderStatusUpdater` under `app/(admin)/orders/components/OrderStatusUpdater.tsx`:
  - `'use client';`
  - Props:
    - `orderId: string;`
    - `initialStatus: OrderStatus;`
  - State:
    - `status` (current selected status).
    - `isSaving` (boolean).
  - Hooks:
    - `useToast()` from `@/components/ui/Toast` for success/error toasts.
    - `useRouter()` from `next/navigation` for `router.refresh()` after updates (optional but recommended).
- UI/behavior:
  - Render:
    - A `<select>` for statuses (Pending, Paid, Cancelled, Failed).
    - A primary “Update status” button.
  - On button click:
    - If `status` hasn’t changed from `initialStatus`, no-op or disable the button.
    - Set `isSaving = true`.
    - `fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })`.
    - On non-OK response:
      - Parse JSON body (if possible).
      - Call `showToast(message, 'error', { status: res.status, body, url: res.url, method: 'PATCH' })`.
    - On success:
      - Parse updated order from the response.
      - Update local `status` state to `order.status`.
      - Optionally call `router.refresh()` to sync the server-rendered sections.
      - Call `showToast('Order status updated', 'success', { status: res.status, body: order, url: res.url, method: 'PATCH' })`.
    - Wrap request in `try/catch`:
      - On thrown errors, build a generic error body (with stack) and show an error toast.
    - Finally, set `isSaving = false`.

### 3.5 Error Handling and Toasts
- Follow the global rule: never swallow data-fetching or API errors.
  - All server-side fetch helpers return an `error` object consumed by `ErrorToastHandler`.
  - All client-side mutations (`OrderStatusUpdater`) use `useToast().showToast` with `{ status, body, url, method }`.
- No direct `alert`/`confirm` usage; if a destructive action is added later (e.g., deleting an order), use `ConfirmDialog` from `@/components/ui/ConfirmDialog`.

### 3.6 Caching and Revalidation
- Orders are time-sensitive; initial implementation should treat them as fully dynamic:
  - All admin `fetch` calls use `cache: 'no-store'`.
  - API routes are not statically cached.
- Revalidation:
  - `PATCH /api/admin/orders/[id]` route calls `revalidatePath('/(admin)/orders', 'page')` and `revalidatePath('/(admin)/orders/[id]', 'page')` inside a `try/catch`.
  - If we later adopt cache components for order pages:
    - Wrap server fetchers with `'use cache'` and `cacheTag('orders')`.
    - Use `updateTag('orders')` (or similar) in status update actions to invalidate cache instead of `revalidatePath`.
    - Avoid using `cookies()` in cached scopes; read any required runtime values outside and pass them in as props.

---

## 4. Testing Plan

### 4.1 Service and Controller Unit Tests
- Create `test/unit/order.service.test.ts`:
  - Use in-memory Mongo via existing `test/test-db.ts` helpers.
  - Cover `listOrders`:
    - Correct pagination (`page`, `limit`, `total`, `totalPages`).
    - Filtering behavior for each status.
    - Sorting by `createdAt` descending.
  - Cover `getOrderById`:
    - Returns the expected order for a valid ID.
    - Throws `INVALID_ORDER_ID` for malformed IDs.
    - Throws `ORDER_NOT_FOUND` for non-existent IDs.
  - Cover `updateOrderStatusById`:
    - Successfully updates status and `updatedAt`.
    - Throws `ORDER_NOT_FOUND` when ID does not exist.
    - (If transition rules are added later) verify invalid transitions throw `AppError` with an appropriate code.
- Create `test/unit/order.controller.test.ts`:
  - Mock service layer to focus on validation and error mapping.
  - Verify `handleAdminListOrders`:
    - Calls service with correct normalized parameters.
    - Returns 400 for invalid status strings.
  - Verify `handleAdminGetOrder` and `handleAdminUpdateOrderStatus`:
    - Map `AppError` statuses and bodies correctly.

### 4.2 API Integration Tests
- Add `test/integration/orders.test.ts`:
  - Import API handlers from:
    - `app/api/admin/orders/route.ts`
    - `app/api/admin/orders/[id]/route.ts`
  - Use real Mongo memory server seeded with several orders across statuses and timestamps.
  - Test `GET /api/admin/orders`:
    - Returns correct shape `{ orders, pagination }`.
    - Respects `page` and `limit` query params.
    - Filters by `status` correctly.
  - Test `GET /api/admin/orders/:id`:
    - Returns order data for valid IDs.
    - Returns 404 for non-existent IDs.
    - Returns 400 for invalid ID formats.
  - Test `PATCH /api/admin/orders/:id`:
    - Updates the order status and returns updated order.
    - Returns 400 for invalid statuses.
    - Returns 404 for non-existent IDs.

### 4.3 Frontend Behavior (Manual and Optional Automated Tests)
- Manual QA scenarios:
  - Orders list:
    - Navigate to `/orders`, verify loaded orders and pagination.
    - Apply each status filter; ensure list contents change accordingly.
    - Intentionally break the API or point to an invalid URL to confirm error toasts fire with full payload.
  - Order detail:
    - Open several orders; confirm items, totals, and metadata render correctly.
    - Change status to each value; check for success toasts and visual updates.
    - Validate that invalid updates (e.g., forcing an invalid status in dev tools) produce error toasts.
- Optional automated tests:
  - Component tests for `OrderStatusUpdater` using the existing testing stack (Vitest + React Testing Library).
  - Later, e2e tests (Playwright or similar) to cover the full admin order management flow end-to-end.

---

## 5. Implementation Order

1. **Backend foundation**
   - Extend `lib/order/order.service.ts` with `getOrderById`, `listOrders`, and `updateOrderStatusById`.
   - Add `UpdateOrderStatusSchema` (and optional list response schema) in `lib/order/order.schema.ts`.
   - Create `lib/order/order.controller.ts` for admin-facing handlers.
   - Add the `{ status: 1, createdAt: -1 }` index to the `orders` collection.

2. **API routes**
   - Implement `GET /api/admin/orders` in `app/api/admin/orders/route.ts`.
   - Implement `GET` and `PATCH /api/admin/orders/[id]` in `app/api/admin/orders/[id]/route.ts`, including cache revalidation hooks.

3. **Admin UI**
   - Add the “Orders” link to `app/(admin)/layout.tsx`.
   - Build `app/(admin)/orders/page.tsx` with fetch helper, `OrdersStatusFilter`, orders table, and pagination.
   - Build `app/(admin)/orders/[id]/page.tsx` with detailed order view and `OrderStatusUpdater`.

4. **Testing and polish**
   - Implement and run unit tests for service and controller, plus integration tests for the new API routes.
   - Perform manual QA for the core flows (list, filter, detail, status update).
   - Adjust UI, error messages, and performance based on feedback and test results.

