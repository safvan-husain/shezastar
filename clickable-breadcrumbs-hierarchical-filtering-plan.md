# Clickable Breadcrumbs & Hierarchical Category Filtering - Implementation Plan

## Overview
Enable breadcrumbs to be clickable links that navigate to parent categories, and implement hierarchical filtering so clicking a parent category shows all products under that category and its subcategories.

**Current State:**
- Breadcrumbs are plain text (e.g., "Electronics / Laptops / Gaming Laptops")
- Products are filtered by exact category ID match only
- No way to view all products under a parent category

**Target State:**
- Breadcrumbs are clickable links
- Clicking "Electronics" shows all products in Electronics and all its subcategories
- Clicking "Laptops" shows all products in Laptops and all its sub-subcategories
- Clicking "Gaming Laptops" shows only Gaming Laptops products (current behavior)

---

## 1. Backend Changes

### 1.1 Category Service Enhancement
**File:** `lib/category/category.service.ts`

**New Function:** `getCategoryHierarchyIds(identifier: string): Promise<string[]>`
- Accept category ID or slug
- Return array of all category/subcategory IDs in the hierarchy
- Examples:
  - Top-level category → returns [categoryId, all subCategory IDs, all subSubCategory IDs]
  - SubCategory → returns [subCategoryId, all its subSubCategory IDs]
  - SubSubCategory → returns [subSubCategoryId] only

**Implementation:**
```typescript
export async function getCategoryHierarchyIds(identifier: string): Promise<string[]> {
  const collection = await getCollection<CategoryDocument>(COLLECTION);
  const matchedIds = new Set<string>();

  // Try to find by ObjectId first (top-level category)
  if (ObjectId.isValid(identifier)) {
    const category = await collection.findOne({ _id: new ObjectId(identifier) });
    if (category) {
      matchedIds.add(category._id.toString());
      category.subCategories?.forEach(sub => {
        matchedIds.add(sub.id);
        (sub.subSubCategories || []).forEach(subSub => matchedIds.add(subSub.id));
      });
      return Array.from(matchedIds);
    }
  }

  // Try to find by slug (top-level category)
  const categoryBySlug = await collection.findOne({ slug: identifier });
  if (categoryBySlug) {
    matchedIds.add(categoryBySlug._id.toString());
    categoryBySlug.subCategories?.forEach(sub => {
      matchedIds.add(sub.id);
      (sub.subSubCategories || []).forEach(subSub => matchedIds.add(subSub.id));
    });
    return Array.from(matchedIds);
  }

  // Try to find as subcategory
  const categoryWithSub = await collection.findOne({ 
    $or: [
      { 'subCategories.id': identifier },
      { 'subCategories.slug': identifier }
    ]
  });
  if (categoryWithSub) {
    const subCategory = categoryWithSub.subCategories.find(
      sub => sub.id === identifier || sub.slug === identifier
    );
    if (subCategory) {
      matchedIds.add(subCategory.id);
      (subCategory.subSubCategories || []).forEach(subSub => matchedIds.add(subSub.id));
      return Array.from(matchedIds);
    }
  }

  // Try to find as sub-subcategory
  const categoryWithSubSub = await collection.findOne({
    $or: [
      { 'subCategories.subSubCategories.id': identifier },
      { 'subCategories.subSubCategories.slug': identifier }
    ]
  });
  if (categoryWithSubSub) {
    for (const sub of categoryWithSubSub.subCategories) {
      const subSub = sub.subSubCategories?.find(
        s => s.id === identifier || s.slug === identifier
      );
      if (subSub) {
        matchedIds.add(subSub.id);
        return Array.from(matchedIds);
      }
    }
  }

  throw new AppError(404, 'CATEGORY_NOT_FOUND', {
    message: `Category with identifier "${identifier}" not found`
  });
}
```

### 1.2 Product Service Update
**File:** `lib/product/product.service.ts`

**Update:** Replace `resolveCategoryFilterIds` with call to new service function
```typescript
// Remove the existing resolveCategoryFilterIds function
// Update getAllProducts to use the new service function:

import { getCategoryHierarchyIds } from '@/lib/category/category.service';

export async function getAllProducts(page = 1, limit = 20, categoryId?: string) {
  const collection = await getCollection<ProductDocument>(COLLECTION);
  const skip = (page - 1) * limit;
  let filter: Record<string, any> = {};

  if (categoryId) {
    const categoryFilterIds = await getCategoryHierarchyIds(categoryId);
    filter = { subCategoryIds: { $in: categoryFilterIds } };
  }

  const [docs, total] = await Promise.all([
    collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    products: toProducts(docs),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### 1.3 New API Endpoint (Optional but Recommended)
**File:** `app/api/categories/hierarchy/route.ts`

**Purpose:** Get category hierarchy info for a given identifier
```typescript
import { NextResponse } from 'next/server';
import { getCategoryHierarchyIds } from '@/lib/category/category.service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier');

  if (!identifier) {
    return NextResponse.json(
      { error: 'identifier query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const ids = await getCategoryHierarchyIds(identifier);
    return NextResponse.json({ ids });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get category hierarchy' },
      { status: error.status || 500 }
    );
  }
}
```

---

## 2. Frontend Changes

### 2.1 Breadcrumb Component
**File:** `app/(store)/category/[slug]/components/Breadcrumb.tsx` (NEW)

**Purpose:** Reusable breadcrumb component with clickable links

```typescript
'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  slug: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--storefront-text-muted)]">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.slug} className="flex items-center gap-2">
              {!isLast ? (
                <>
                  <Link
                    href={`/category/${item.slug}`}
                    className="hover:text-[var(--storefront-text-primary)] transition-colors underline"
                  >
                    {item.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              ) : (
                <span className="text-[var(--storefront-text-primary)] font-medium">
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### 2.2 Update Category Page
**File:** `app/(store)/category/[slug]/page.tsx`

**Changes:**
1. Update `findCategoryBySlug` to return breadcrumb items with slugs
2. Import and use the new `Breadcrumb` component
3. Update heading to reflect hierarchical filtering

```typescript
// Update the return type of findCategoryBySlug
interface CategoryMatch {
  title: string;
  filterId: string;
  breadcrumbs: Array<{ name: string; slug: string }>;
  level: 'category' | 'subcategory' | 'subsubcategory';
}

function findCategoryBySlug(categories: Category[], slug: string): CategoryMatch | null {
  // Check top-level categories
  for (const category of categories) {
    if (matchesIdentifier(slug, category)) {
      return {
        title: category.name,
        filterId: category.id,
        breadcrumbs: [{ name: category.name, slug: category.slug || category.id }],
        level: 'category',
      };
    }

    // Check subcategories
    for (const sub of category.subCategories) {
      if (matchesIdentifier(slug, sub)) {
        return {
          title: sub.name,
          filterId: sub.id,
          breadcrumbs: [
            { name: category.name, slug: category.slug || category.id },
            { name: sub.name, slug: sub.slug || sub.id },
          ],
          level: 'subcategory',
        };
      }

      // Check sub-subcategories
      const subSub = sub.subSubCategories.find((s) => matchesIdentifier(slug, s));
      if (subSub) {
        return {
          title: subSub.name,
          filterId: subSub.id,
          breadcrumbs: [
            { name: category.name, slug: category.slug || category.id },
            { name: sub.name, slug: sub.slug || sub.id },
            { name: subSub.name, slug: subSub.slug || subSub.id },
          ],
          level: 'subsubcategory',
        };
      }
    }
  }

  return null;
}

// In the component JSX, replace the breadcrumb paragraph with:
import { Breadcrumb } from './components/Breadcrumb';

// In the return statement:
<div className="space-y-3">
  <Breadcrumb items={match.breadcrumbs} />
  <h1 className="text-3xl sm:text-4xl font-bold text-[var(--storefront-text-primary)]">
    {match.title}
  </h1>
  <p className="text-[var(--storefront-text-secondary)]">
    {match.level === 'subsubcategory' 
      ? `Products in ${match.title}.`
      : `All products in ${match.title} and its subcategories.`
    }
    {products.length === 0 ? ' No items yet.' : ''}
  </p>
</div>
```

---

## 3. Unit Tests

### 3.1 Category Service Tests
**File:** `lib/category/category.service.test.ts`

**New Tests:**
```typescript
describe('getCategoryHierarchyIds', () => {
  it('should return all IDs for top-level category', async () => {
    // Create category with subcategories and sub-subcategories
    // Call getCategoryHierarchyIds with category ID
    // Assert all IDs are returned
  });

  it('should return subcategory and its children IDs', async () => {
    // Create category hierarchy
    // Call getCategoryHierarchyIds with subcategory ID
    // Assert only subcategory and its sub-subcategories are returned
  });

  it('should return only sub-subcategory ID', async () => {
    // Create category hierarchy
    // Call getCategoryHierarchyIds with sub-subcategory ID
    // Assert only that ID is returned
  });

  it('should work with slugs', async () => {
    // Test with category slug, subcategory slug, sub-subcategory slug
  });

  it('should throw AppError when category not found', async () => {
    // Call with invalid identifier
    // Assert AppError with 404 status
  });
});
```

### 3.2 Product Service Tests
**File:** `lib/product/product.service.test.ts`

**Update Existing Tests:**
```typescript
describe('getAllProducts with hierarchical filtering', () => {
  it('should return products from category and all subcategories', async () => {
    // Create category with subcategories
    // Create products in different levels
    // Call getAllProducts with top-level category ID
    // Assert all products are returned
  });

  it('should return products from subcategory and its children', async () => {
    // Create hierarchy
    // Create products at different levels
    // Call getAllProducts with subcategory ID
    // Assert only subcategory and sub-subcategory products returned
  });

  it('should return only exact match for sub-subcategory', async () => {
    // Create hierarchy
    // Create products at different levels
    // Call getAllProducts with sub-subcategory ID
    // Assert only that level's products returned
  });
});
```

### 3.3 Frontend Component Tests
**File:** `app/(store)/category/[slug]/components/Breadcrumb.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('should render nothing when items array is empty', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single item without link', () => {
    const items = [{ name: 'Electronics', slug: 'electronics' }];
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should render multiple items with links except last', () => {
    const items = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Gaming', slug: 'gaming-laptops' },
    ];
    render(<Breadcrumb items={items} />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/category/electronics');
    expect(links[1]).toHaveAttribute('href', '/category/laptops');
    
    // Last item should not be a link
    expect(screen.getByText('Gaming')).not.toHaveAttribute('href');
  });

  it('should render separators between items', () => {
    const items = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Laptops', slug: 'laptops' },
    ];
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('/')).toBeInTheDocument();
  });
});
```

---

## 4. Integration Tests

### 4.1 Category Hierarchy API Test
**File:** `__tests__/e2e/category-hierarchy.test.ts`

```typescript
import { GET } from '@/app/api/categories/hierarchy/route';
import { createCategory, addSubCategory, addSubSubCategory } from '@/lib/category/category.service';

describe('GET /api/categories/hierarchy', () => {
  it('should return hierarchy IDs for top-level category', async () => {
    // Create category with full hierarchy
    const category = await createCategory({
      name: 'Electronics',
      subCategories: [
        {
          id: 'laptops',
          name: 'Laptops',
          subSubCategories: [
            { id: 'gaming', name: 'Gaming' },
            { id: 'business', name: 'Business' },
          ],
        },
      ],
    });

    const req = new Request(
      `http://localhost:3000/api/categories/hierarchy?identifier=${category.id}`
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ids).toContain(category.id);
    expect(data.ids).toContain('laptops');
    expect(data.ids).toContain('gaming');
    expect(data.ids).toContain('business');
  });

  it('should return hierarchy IDs for subcategory', async () => {
    // Similar test for subcategory
  });

  it('should return 404 for non-existent category', async () => {
    const req = new Request(
      'http://localhost:3000/api/categories/hierarchy?identifier=invalid'
    );
    const response = await GET(req);

    expect(response.status).toBe(404);
  });
});
```

### 4.2 Product Filtering Integration Test
**File:** `__tests__/e2e/product-filtering.test.ts`

```typescript
import { GET } from '@/app/api/products/route';
import { createCategory } from '@/lib/category/category.service';
import { createProduct } from '@/lib/product/product.service';

describe('GET /api/products with hierarchical filtering', () => {
  it('should return all products in category hierarchy', async () => {
    // Create category hierarchy
    const category = await createCategory({
      name: 'Electronics',
      subCategories: [
        {
          id: 'laptops',
          name: 'Laptops',
          subSubCategories: [{ id: 'gaming', name: 'Gaming' }],
        },
      ],
    });

    // Create products at different levels
    const product1 = await createProduct({
      name: 'Product 1',
      basePrice: 100,
      subCategoryIds: ['laptops'],
      images: [],
      variants: [],
    });

    const product2 = await createProduct({
      name: 'Product 2',
      basePrice: 200,
      subCategoryIds: ['gaming'],
      images: [],
      variants: [],
    });

    // Query with top-level category
    const req = new Request(
      `http://localhost:3000/api/products?categoryId=${category.id}`
    );
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(2);
    expect(data.products.map((p: any) => p.id)).toContain(product1.id);
    expect(data.products.map((p: any) => p.id)).toContain(product2.id);
  });

  it('should filter by subcategory and its children only', async () => {
    // Create hierarchy with products at multiple levels
    // Query with subcategory ID
    // Assert only subcategory and sub-subcategory products returned
  });
});
```

### 4.3 End-to-End Category Page Test
**File:** `__tests__/e2e/category-page.test.ts`

```typescript
import { render, screen } from '@testing-library/react';
import CategoryPage from '@/app/(store)/category/[slug]/page';
import { createCategory, getAllCategories } from '@/lib/category/category.service';
import { createProduct } from '@/lib/product/product.service';

describe('Category Page with Hierarchical Filtering', () => {
  it('should display all products for top-level category', async () => {
    // Create category hierarchy
    // Create products at different levels
    // Render page with category slug
    // Assert all products are displayed
    // Assert breadcrumb shows only category name
  });

  it('should display clickable breadcrumbs', async () => {
    // Create hierarchy
    // Render page with sub-subcategory slug
    // Assert breadcrumbs are rendered
    // Assert parent links are present
    // Assert last item is not a link
  });

  it('should show appropriate description based on level', async () => {
    // Test that top-level shows "All products in X and its subcategories"
    // Test that sub-subcategory shows "Products in X"
  });
});
```

---

## 5. Implementation Order

### Phase 1: Backend Foundation
1. Add `getCategoryHierarchyIds` to category service
2. Update product service to use new function
3. Add unit tests for category service
4. Update product service tests
5. Create optional hierarchy API endpoint

### Phase 2: Frontend Components
1. Create `Breadcrumb` component
2. Add component tests
3. Update category page to use new component
4. Update `findCategoryBySlug` to return breadcrumb data with slugs

### Phase 3: Integration Testing
1. Add category hierarchy API tests
2. Add product filtering integration tests
3. Add end-to-end category page tests

### Phase 4: Manual Testing & Polish
1. Test all breadcrumb navigation paths
2. Verify product counts at each level
3. Test with empty categories
4. Verify error handling
5. Check accessibility (keyboard navigation, screen readers)

---

## 6. Edge Cases & Considerations

### Edge Cases to Handle:
1. **Empty categories**: Show appropriate message when parent category has no products
2. **Orphaned products**: Products with invalid category IDs should not appear
3. **Slug conflicts**: Ensure slugs are unique across all levels
4. **Deep linking**: Direct URL access to any category level should work
5. **Category deletion**: What happens to products when a category is deleted?

### Performance Considerations:
1. **Caching**: Consider caching category hierarchy lookups
2. **Database indexes**: Ensure `subCategoryIds` field is indexed
3. **Query optimization**: Use MongoDB aggregation if filtering becomes complex

### Accessibility:
1. Use semantic HTML (`<nav>`, `<ol>`, `<li>`)
2. Add `aria-label` to breadcrumb navigation
3. Ensure keyboard navigation works for all links
4. Test with screen readers

### SEO:
1. Add structured data (BreadcrumbList schema)
2. Ensure proper heading hierarchy (h1 for category name)
3. Add meta descriptions for category pages

---

## 7. Success Criteria

### Functional Requirements:
- ✅ Breadcrumbs are clickable and navigate to parent categories
- ✅ Top-level category shows all products in hierarchy
- ✅ Subcategory shows products in that subcategory and its children
- ✅ Sub-subcategory shows only its products (current behavior)
- ✅ All links use slugs for clean URLs

### Technical Requirements:
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ No breaking changes to existing API
- ✅ Error handling follows AppError pattern
- ✅ Frontend follows storefront color system
- ✅ Code follows project structure guidelines

### User Experience:
- ✅ Breadcrumbs are visually distinct and clearly clickable
- ✅ Hover states provide clear feedback
- ✅ Current category is visually emphasized
- ✅ Product count descriptions are accurate
- ✅ Loading states are handled gracefully

---
