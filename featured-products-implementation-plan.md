# Featured Products Management - Implementation Plan

## Overview
Create a comprehensive featured products management system with:
1. Admin settings page for managing featured products
2. Double-tap functionality on products page to add to featured list
3. State-based filtering (no search API needed)
4. Integration with existing products API

## Task Checklist

### Phase 1: Backend & API Setup ✅ COMPLETE
- [x] **Task 1.1**: Featured products API routes ✅
  - File: `app/api/admin/settings/featured-products/route.ts` ✅
  - GET endpoint returns full Product[] (populated from IDs) ✅
  - POST endpoint adds product to featured list ✅
  
- [x] **Task 1.2**: Create DELETE route for removing featured products
  - File: `app/api/admin/settings/featured-products/[id]/route.ts`
  - Implement DELETE handler using `handleRemoveFeaturedProduct()`
  - Add revalidation for featured products page

- [x] **Task 1.3**: Schema and controller ✅
  - `AddFeaturedProductSchema` exists in schema file ✅
  - Controller methods implemented: `handleGetFeaturedProducts`, `handleAddFeaturedProduct`, `handleRemoveFeaturedProduct` ✅
  - Service methods implemented: `getFeaturedProducts()`, `addFeaturedProduct()`, `removeFeaturedProduct()` ✅

### Phase 2: Featured Products Settings Page
- [x] **Task 2.1**: Create featured products settings page
  - File: `app/(admin)/settings/featured-products/page.tsx`
  - Server component that fetches featured products
  - Display products in a grid with remove functionality
  - Show empty state when no featured products

- [x] **Task 2.2**: Create FeaturedProductsList client component
  - File: `app/(admin)/settings/featured-products/components/FeaturedProductsList.tsx`
  - Display featured products with images, names, prices
  - Remove button with confirmation
  - Drag-and-drop reordering (optional enhancement)
  - Toast notifications for success/error

- [x] **Task 2.3**: Create AddFeaturedProductModal component
  - File: `app/(admin)/settings/featured-products/components/AddFeaturedProductModal.tsx`
  - Modal with product search/filter using state
  - Fetch all products from existing API
  - Client-side filtering by name/category
  - Add button to add product to featured list

### Phase 3: Products Page Integration ✅ COMPLETE
- [x] **Task 3.1**: Add double-tap detection to product cards ✅
  - File: `app/(admin)/products/components/ProductCard.tsx` (create new component)
  - Extract product card from `app/(admin)/products/page.tsx`
  - Implement double-tap/double-click detection
  - Show "Add to Featured" modal/toast on double-tap

- [x] **Task 3.2**: Create AddToFeaturedButton component ✅
  - File: `app/(admin)/products/components/AddToFeaturedButton.tsx`
  - Small button/icon overlay on product card
  - Appears on hover or after double-tap
  - Calls API to add product to featured list
  - Shows success/error toast

- [x] **Task 3.3**: Update products page to use new ProductCard ✅
  - File: `app/(admin)/products/page.tsx`
  - Replace inline card markup with ProductCard component
  - Pass necessary props and handlers

### Phase 4: Settings Page Navigation ✅ COMPLETE
- [x] **Task 4.1**: Add Featured Products link to settings page ✅
  - File: `app/(admin)/settings/page.tsx`
  - Add new card linking to `/settings/featured-products`
  - Use consistent styling with existing cards
  - Icon and description for featured products

### Phase 5: Testing & Polish
- [ ] **Task 5.1**: Manual testing
  - Test adding products to featured list from products page
  - Test removing products from featured list
  - Test double-tap functionality
  - Test empty states and error handling

- [ ] **Task 5.2**: Error handling verification
  - Ensure all API errors show toasts
  - Verify error messages are user-friendly
  - Test network failure scenarios

- [ ] **Task 5.3**: UI/UX polish
  - Verify responsive design on mobile/tablet
  - Check loading states
  - Ensure consistent styling with existing pages

## Technical Notes

### Existing Infrastructure (Already Implemented) ✅
- **Featured Products API**: `app/api/admin/settings/featured-products/route.ts` ✅
  - `GET /api/admin/settings/featured-products` - Returns Product[] (fully populated)
  - `POST /api/admin/settings/featured-products` - Adds product (body: `{ productId: string }`)
  - Returns 400 if product already featured
  - Returns 404 if product doesn't exist
  - Filters out deleted products automatically
  
- **Products API**: `app/api/products/route.ts` - GET endpoint returns all products ✅

- **App Settings Service**: `lib/app-settings/app-settings.service.ts` ✅
  - `getFeaturedProducts()` - Returns Product[] with full product data
  - `addFeaturedProduct(productId)` - Adds product to featured list
  - `removeFeaturedProduct(productId)` - Removes from featured list (idempotent)
  
- **Controller**: `lib/app-settings/app-settings.controller.ts` ✅
  - `handleGetFeaturedProducts()` - Wraps service with error handling
  - `handleAddFeaturedProduct(input)` - Validates with Zod schema
  - `handleRemoveFeaturedProduct(productId)` - Wraps service with error handling
  
- **Product Model**: `lib/product/model/product.model.ts` - Product type definition ✅
- **Error Handling**: `components/ErrorToastHandler.tsx` - Toast error display ✅

### State-Based Filtering Approach
Instead of creating a search API:
1. Fetch all products once from `/api/products`
2. Store in React state
3. Filter client-side using `Array.filter()` based on:
   - Product name (case-insensitive)
   - Category
   - Price range
4. Display filtered results in real-time

### Double-Tap Implementation
```typescript
let lastTap = 0;
const handleTap = () => {
  const now = Date.now();
  const DOUBLE_TAP_DELAY = 300; // ms
  
  if (now - lastTap < DOUBLE_TAP_DELAY) {
    // Double tap detected
    showAddToFeaturedOption();
  }
  lastTap = now;
};
```

### Component Architecture
```
app/(admin)/settings/featured-products/
├── page.tsx (Server Component - fetches data)
└── components/
    ├── FeaturedProductsList.tsx (Client - manages list)
    └── AddFeaturedProductModal.tsx (Client - search & add)

app/(admin)/products/
├── page.tsx (Server Component - updated)
└── components/
    ├── ProductCard.tsx (Client - extracted card with double-tap)
    ├── AddToFeaturedButton.tsx (Client - quick add button)
    └── ProductCardImage.tsx (existing)
```

## Dependencies
- No new packages required
- Uses existing:
  - `nanoid` for IDs
  - `next/cache` for revalidation
  - Toast system for notifications
  - Existing UI components (Button, Card)

## API Endpoints Summary (from integration tests)

### GET /api/admin/settings/featured-products
- Returns: `Product[]` (fully populated product objects)
- Status: 200
- Empty array if no featured products
- Automatically filters out deleted products

### POST /api/admin/settings/featured-products
- Body: `{ productId: string }`
- Returns: Full app settings object with `featuredProductIds: string[]`
- Status: 201 on success
- Status: 400 if product already featured (code: `PRODUCT_ALREADY_FEATURED`)
- Status: 404 if product doesn't exist
- Status: 400 if productId missing or invalid format

### DELETE /api/admin/settings/featured-products/[id]
- Removes product from featured list
- Status: 200
- Idempotent (no error if product not in list)
- Returns: Full app settings object

## Completion Criteria
- [ ] DELETE route implemented
- [ ] All frontend tasks complete
- [ ] Featured products can be added from products page (double-tap)
- [ ] Featured products can be managed from settings page
- [ ] All errors surface to UI via toasts
- [ ] Navigation from settings page works
- [ ] Responsive design verified
- [ ] No console errors or warnings
