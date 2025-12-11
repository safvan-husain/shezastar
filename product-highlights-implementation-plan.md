# Product Highlights Implementation Plan

## 1. Overview
- Add a `highlights` list (array of short strings) to the product domain so admins can capture key selling points and storefront visitors can quickly scan them on the product details page.
- Propagate `highlights` end-to-end: MongoDB document, domain model, Zod schemas, services/controllers, API routes, admin product form, and storefront product details UI.
- Keep the change backwards-compatible with existing products and tests by treating `highlights` as optional in persistence and defaulting to an empty array in DTOs.

---

## 2. Data Model & Backend

### 2.1 Product Model (`lib/product/model/product.model.ts`)
- Extend `ProductDocument` (DB shape) with an optional `highlights?: string[]` field.
- Extend `Product` (DTO) with a non-null `highlights: string[]` field exposed to callers.
- Update `toProduct`:
  - Map `doc.highlights ?? []` into `product.highlights`.
  - Preserve existing fields and behaviour (e.g. `stockCount` conditional mapping).
- `toProducts` already delegates to `toProduct`, so no additional changes needed there.

### 2.2 Zod Schemas & Types (`lib/product/product.schema.ts`)
- Update `CreateProductSchema`:
  - Add `highlights: z.array(z.string().min(1).trim()).default([])` so input can omit `highlights` entirely.
  - Optionally cap the number of highlights, e.g. `.max(10, 'Limit highlights to 10 items')` to keep UI manageable.
- Update `UpdateProductSchema`:
  - Add `highlights: z.array(z.string().min(1).trim()).optional()`.
  - This allows clearing highlights by explicitly sending an empty array in update requests.
- Ensure exported TypeScript types include the new field:
  - `CreateProductInput` / `UpdateProductInput` gain `highlights?: string[]`.
  - Other types (`ProductImage`, `ProductVariant`, `InstallationService`) remain unchanged.

### 2.3 Service Layer (`lib/product/product.service.ts`)
- `createProduct(input: CreateProductInput)`:
  - When constructing `doc: Omit<ProductDocument, '_id'>`, include `highlights: input.highlights ?? []`.
  - No change to existing offer price validation or image/variant handling.
- `updateProduct(id: string, input: UpdateProductInput)`:
  - Support updating highlights:
    - If `input.highlights` is defined (including empty array), set `updateDoc.highlights = input.highlights`.
  - Keep existing behaviour for other fields and timestamps.
- Read operations (`getProduct`, `getAllProducts`) automatically include `highlights` via `toProduct`/`toProducts`; no extra work required.

### 2.4 Controllers & Error Handling (`lib/product/product.controller.ts`)
- No special controller logic is required for highlights beyond the schema updates:
  - `handleCreateProduct` and `handleUpdateProduct` will accept `highlights` once schemas are extended.
- Confirm that AppError handling and `catchError` mapping continue to behave identically for all existing product flows.

### 2.5 API Routes & Serialization

#### 2.5.1 Create Product (`app/api/products/route.ts`)
- In the multipart `POST` handler:
  - Decide on the transport format for highlights from the admin form (see Section 3):
    - Recommended: a JSON-encoded array field `highlights` (e.g. `["Fast installation","Energy efficient"]`).
  - Parse from `FormData`:
    - `const highlights = formData.get('highlights') ? JSON.parse(formData.get('highlights') as string) : undefined;`
  - Include `highlights` in `productData` passed into `handleCreateProduct`.
- In the JSON branch:
  - No new parsing logic needed; the controller schema will validate `highlights` from the JSON body directly.

#### 2.5.2 Update Product (`app/api/products/[id]/route.ts`)
- In the multipart `PUT` handler:
  - Parse optional `highlights` as JSON from `FormData` (same format as create).
  - If the field is present, add `productData.highlights = highlights;` so updates can add, modify, or clear highlights.
- In the JSON branch:
  - Forward any `highlights` array in the JSON payload directly to `handleUpdateProduct`.

#### 2.5.3 Seeds & Scripts
- Review `scripts/seed-products.ts` (and any other product seeding scripts):
  - Optionally populate `highlights` for seeded products where the source data has structured feature information.
  - If no highlight data exists, rely on the default empty array produced by `CreateProductSchema`.

---

## 3. Admin Product Editor

### 3.1 Local State & FormData (`app/(admin)/products/components/ProductForm.tsx`)
- Add new React state for highlights:
  - `const [highlights, setHighlights] = useState<string[]>(initialData?.highlights || []);`
- Extend `handleSubmit` to send highlights via `FormData`:
  - Before sending, normalise input:
    - `const normalizedHighlights = highlights.map(h => h.trim()).filter(Boolean);`
  - Append to form data:
    - `formData.append('highlights', JSON.stringify(normalizedHighlights));`
- Ensure `initialData` shape is updated (once backend work is done) so editing an existing product pre-populates highlight state.

### 3.2 Basic Info Step UI (`app/(admin)/products/components/steps/BasicInfoStep.tsx`)
- Extend `BasicInfoStepProps`:
  - Add `highlights: string[];`
  - Add `onHighlightsChange: (value: string[]) => void;`
- UI design for highlights:
  - Add a "Product Highlights" section below the description:
    - Each highlight is rendered as an `Input` row in a vertical list.
    - Provide an "Add highlight" button that appends an empty string entry.
    - Provide a small "Remove" icon/button per row to delete that highlight.
  - Enforce lightweight guidance in help text:
    - "Short, benefit-focused bullet points. One per row."
- Interaction behaviour:
  - On text change in any row, update the corresponding index in the `highlights` array and call `onHighlightsChange` with the new array.
  - Optionally prevent more than 10 highlights on the client side to match Zod max constraint.
- Wire-up from `ProductForm`:
  - Pass `highlights={highlights}` and `onHighlightsChange={setHighlights}` when rendering `BasicInfoStep`.

### 3.3 Review Step Preview (`app/(admin)/products/components/steps/ReviewStep.tsx`)
- Extend `ReviewStepProps` to include `highlights: string[]`.
- Render highlights in the preview alongside the product description:
  - If `highlights.length > 0`, display a "Key Highlights" header and a bullet list of the highlight strings.
  - Use admin theme tokens (`--text-*`, `--border-*`) so styling matches the existing preview layout.
- Update `ProductForm` to pass `highlights` into `ReviewStep`.

### 3.4 Validation, UX, and Error Handling
- Keep highlights optional to avoid blocking product creation when admins do not provide them.
- Ensure that any errors returned from create/update product API calls continue to be surfaced via the existing `showToast` logic in `ProductForm` (no swallowing of errors).
- Consider adding small client-side validation:
  - Warn or prevent saving if any highlight exceeds a reasonable length (e.g. 120–160 characters) while still letting backend be the source of truth.

---

## 4. Storefront Product Details

### 4.1 Rendering Highlights (`app/(store)/product/components/ProductDetails.tsx`)
- Extend the `Product` type usage to assume `product.highlights: string[]` is available from the domain model.
- Integrate highlights into the details column:
  - After the product description, if `product.highlights.length > 0`, render a "Key Highlights" section.
  - Display highlights as a vertical bullet list or check-list using the storefront color tokens:
    - Text: `--storefront-text-primary` / `--storefront-text-secondary`.
    - Borders/backgrounds (if needed): `--storefront-border`, `--storefront-bg-subtle`.
- Keep layout responsive:
  - Ensure highlights do not push critical price/CTA content too far down on smaller screens (e.g. collapse long lists with “Show more” if necessary, but this can be an enhancement after basic rendering).

### 4.2 Data Flow & Error Handling
- No change is required in `app/(store)/product/[id]/page.tsx` for fetching:
  - It already requests `/api/products/:id` and maps responses to the `Product` type; `highlights` will be part of that payload automatically.
- Maintain existing error handling flow:
  - If the product fetch fails, continue to surface errors using `ProductErrorHandler` and the toast system.

---

## 5. Testing & Verification

### 5.1 Unit Tests
- Update `test/unit/product.service.test.ts`:
  - Extend the "should create a product" test to include a small highlights array in the input and assert `result.highlights` matches.
  - Optionally add a test verifying that `getProduct` returns `highlights: []` when the underlying document has no `highlights` field (backwards compatibility).
- If there are any unit tests for controllers or schemas, extend them to cover the new `highlights` field in both create and update paths.

### 5.2 Integration Tests
- Review integration tests that call `createProduct` (e.g. wishlist, featured products, cart):
  - Ensure they compile with the extended `CreateProductInput` (ideally relying on the schema default so tests do not need to set `highlights` explicitly).
  - Optionally add a focused integration test that verifies `/api/products` GET/POST roundtrips `highlights`.

### 5.3 Manual QA
- Admin:
  - Create a new product with several highlights and confirm they appear in the Review step.
  - Edit an existing product to add, modify, and clear highlights, confirming changes persist.
  - Verify that error toasts show complete details if API calls fail.
- Storefront:
  - Visit a product with highlights and confirm they render correctly under the description.
  - Confirm products without highlights still render cleanly (no empty section headings).

---

## 6. Rollout & Backwards Compatibility
- Backwards compatibility:
  - Existing products in MongoDB without a `highlights` field will be mapped to `highlights: []` by `toProduct`.
  - Admin edit forms for older products will show an empty highlights list that admins can start populating.
- Deployment order:
  1) Ship backend changes (model, schema, services, API) and tests.
  2) Deploy admin and storefront UI changes once the API reliably returns the `highlights` field.
- Optional follow-up:
  - Enrich seeded demo products or selected existing products with curated highlights to showcase the feature.

