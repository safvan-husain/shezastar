# Backend Implementation Plan: App Settings with Hero Banner

## Overview
Create a new `app-settings` feature following the established architecture pattern to store and manage configurable site-wide settings, starting with the home hero banner.

---

## 1. Data Model Design

**Collection:** `appSettings` (singleton document)

**Document Structure:**
```typescript
{
  _id: ObjectId,
  homeHeroBanner: {
    imagePath: string,        // e.g., "/images/hero-banner.jpg"
    title: string,            // e.g., "Summer Sale"
    description: string,      // e.g., "Get the best deals..."
    price: number,            // Original price
    offerPrice: number,       // Discounted price
    offerLabel: string,       // e.g., "50% OFF", "Limited Time"
  },
  // Future settings can be added here:
  // categoryBanners: {...},
  // footerSettings: {...},
  updatedAt: Date,
  createdAt: Date
}
```

---

## 2. File Structure

Following the established pattern in `lib/`:

```
lib/app-settings/
├── model/
│   └── app-settings.model.ts    # Document interface, domain model, transformers
├── app-settings.schema.ts        # Zod schemas for validation
├── app-settings.service.ts       # Business logic & MongoDB operations
├── app-settings.controller.ts    # Request validation & error handling
└── index.ts                      # Public exports
```

**Test files:**
```
test/
├── unit/
│   └── app-settings.service.test.ts    # Unit tests for service layer
└── integration/
    └── app-settings.test.ts            # Integration tests for API routes
```

---

## 3. Schema Layer (`app-settings.schema.ts`)

**Schemas to create:**
- `HeroBannerSchema` - Nested object for hero banner fields
- `UpdateHeroBannerSchema` - Input for updating hero banner
- `AppSettingsSchema` - Full settings document (for future expansion)

**Validation rules:**
- `imagePath`: required, min 1 character
- `title`: required, min 1 character
- `description`: required, min 1 character
- `price`: required, min 0
- `offerPrice`: required, min 0, must be less than price
- `offerLabel`: required, min 1 character

**Implementation:**
```typescript
import { z } from 'zod';

export const HeroBannerSchema = z.object({
  imagePath: z.string().min(1, 'Image path is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  offerPrice: z.number().min(0, 'Offer price must be positive'),
  offerLabel: z.string().min(1, 'Offer label is required'),
});

export const UpdateHeroBannerSchema = HeroBannerSchema;

export type HeroBanner = z.infer<typeof HeroBannerSchema>;
export type UpdateHeroBannerInput = z.infer<typeof UpdateHeroBannerSchema>;
```

---

## 4. Model Layer (`model/app-settings.model.ts`)

**Interfaces:**
- `AppSettingsDocument` - MongoDB document shape with `_id` and Date objects
- `AppSettings` - Domain model with string `id` and ISO date strings
- `HeroBanner` - Nested type for hero banner data

**Functions:**
- `toAppSettings(doc)` - Transform MongoDB doc to domain model
- `getDefaultSettings()` - Return default settings when none exist

**Implementation:**
```typescript
import { ObjectId } from 'mongodb';
import { HeroBanner } from '../app-settings.schema';

export interface AppSettingsDocument {
  _id: ObjectId;
  homeHeroBanner?: HeroBanner;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  id: string;
  homeHeroBanner?: HeroBanner;
  createdAt: string;
  updatedAt: string;
}

export function toAppSettings(doc: AppSettingsDocument): AppSettings {
  return {
    id: doc._id.toString(),
    homeHeroBanner: doc.homeHeroBanner,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function getDefaultSettings(): Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    homeHeroBanner: undefined,
  };
}
```

---

## 5. Service Layer (`app-settings.service.ts`)

**Functions to implement:**

### `getAppSettings()`
- Fetch the singleton settings document
- If not exists, return default settings structure
- No AppError thrown if missing (graceful defaults)

### `updateHeroBanner(input: UpdateHeroBannerInput)`
- Validate offerPrice < price
- Upsert the settings document (create if doesn't exist)
- Update `homeHeroBanner` nested object
- Set `updatedAt` timestamp
- Return updated settings

### `initializeSettings()` (optional)
- Create default settings document if none exists
- Useful for seeding/migration

**Error handling:**
- Throw `AppError(400, 'INVALID_OFFER_PRICE')` if offerPrice >= price
- Throw `AppError(500, 'FAILED_TO_UPDATE_SETTINGS')` on DB failures

**Implementation outline:**
```typescript
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { AppSettingsDocument, toAppSettings, getDefaultSettings } from './model/app-settings.model';
import { UpdateHeroBannerInput } from './app-settings.schema';

const COLLECTION = 'appSettings';
const SETTINGS_ID = 'app-settings-singleton';

export async function getAppSettings() {
  const collection = await getCollection<AppSettingsDocument>(COLLECTION);
  const doc = await collection.findOne({});
  
  if (!doc) {
    // Return default structure
    return {
      id: SETTINGS_ID,
      ...getDefaultSettings(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  
  return toAppSettings(doc);
}

export async function updateHeroBanner(input: UpdateHeroBannerInput) {
  // Validate offer price
  if (input.offerPrice >= input.price) {
    throw new AppError(400, 'INVALID_OFFER_PRICE', {
      message: 'Offer price must be less than price',
    });
  }
  
  const collection = await getCollection<AppSettingsDocument>(COLLECTION);
  const now = new Date();
  
  // Upsert: update if exists, create if not
  const result = await collection.findOneAndUpdate(
    {},
    {
      $set: {
        homeHeroBanner: input,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );
  
  if (!result) {
    throw new AppError(500, 'FAILED_TO_UPDATE_SETTINGS');
  }
  
  return toAppSettings(result);
}
```

---

## 6. Controller Layer (`app-settings.controller.ts`)

**Functions to implement:**

### `handleGetAppSettings()`
- Call service.getAppSettings()
- Return `{ status: 200, body: settings }`
- Use `catchError()` for error handling

### `handleUpdateHeroBanner(input: unknown)`
- Parse with `UpdateHeroBannerSchema`
- Call service.updateHeroBanner()
- Return `{ status: 200, body: settings }`
- Use `catchError()` for error handling

**Implementation:**
```typescript
import { catchError } from '@/lib/errors/app-error';
import { UpdateHeroBannerSchema } from './app-settings.schema';
import * as appSettingsService from './app-settings.service';

export async function handleGetAppSettings() {
  try {
    const result = await appSettingsService.getAppSettings();
    return { status: 200, body: result };
  } catch (err) {
    return catchError(err);
  }
}

export async function handleUpdateHeroBanner(input: unknown) {
  try {
    const parsed = UpdateHeroBannerSchema.parse(input);
    const result = await appSettingsService.updateHeroBanner(parsed);
    return { status: 200, body: result };
  } catch (err) {
    return catchError(err);
  }
}
```

---

## 7. API Routes

### Route file: `app/api/admin/settings/route.ts`

**GET `/api/admin/settings`**
- Fetch current app settings
- Call `handleGetAppSettings()`
- Return settings JSON

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { handleGetAppSettings } from '@/lib/app-settings/app-settings.controller';

export async function GET() {
  const { status, body } = await handleGetAppSettings();
  return NextResponse.json(body, { status });
}
```

### Route file: `app/api/admin/settings/hero-banner/route.ts`

**PATCH `/api/admin/settings/hero-banner`**
- Update hero banner settings
- Parse request body
- Call `handleUpdateHeroBanner()`
- Return updated settings

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { handleUpdateHeroBanner } from '@/lib/app-settings/app-settings.controller';

export async function PATCH(req: Request) {
  const body = await req.json();
  const { status, body: result } = await handleUpdateHeroBanner(body);
  return NextResponse.json(result, { status });
}
```

**Note:** Place under `/admin/` path since this is admin-only functionality

---

## 8. Unit Tests (`test/unit/app-settings.service.test.ts`)

**Test cases for service layer:**

### Setup
- Use MongoDB Memory Server for isolation
- Clear database before tests
- Mock file upload utilities if needed

### Test: `should return default settings when none exist`
- Call `getAppSettings()`
- Expect default structure with undefined homeHeroBanner
- Verify no error thrown

### Test: `should update hero banner settings`
- Create valid hero banner input
- Call `updateHeroBanner(input)`
- Verify returned settings contain hero banner data
- Verify document created in database

### Test: `should throw error if offerPrice >= price`
- Create input with offerPrice >= price
- Expect `updateHeroBanner()` to throw AppError
- Verify error code is 'INVALID_OFFER_PRICE'

### Test: `should upsert settings (create if not exists)`
- Clear database
- Call `updateHeroBanner()` with valid input
- Verify settings document created
- Call `updateHeroBanner()` again with different data
- Verify same document updated (not duplicated)

### Test: `should get updated settings after update`
- Update hero banner
- Call `getAppSettings()`
- Verify returned data matches updated values

**Implementation outline:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAppSettings, updateHeroBanner } from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';
import { clear } from '../test-db';

describe('App Settings Service Unit Tests', () => {
  beforeAll(async () => {
    await clear();
  });

  afterAll(async () => {
    await clear();
  });

  it('should return default settings when none exist', async () => {
    const result = await getAppSettings();
    expect(result.homeHeroBanner).toBeUndefined();
    expect(result.id).toBeDefined();
  });

  it('should update hero banner settings', async () => {
    const input = {
      imagePath: '/images/hero.jpg',
      title: 'Summer Sale',
      description: 'Get 50% off on all items',
      price: 100,
      offerPrice: 50,
      offerLabel: '50% OFF',
    };

    const result = await updateHeroBanner(input);
    expect(result.homeHeroBanner).toMatchObject(input);
    expect(result.id).toBeDefined();
  });

  it('should throw error if offerPrice >= price', async () => {
    const input = {
      imagePath: '/images/hero.jpg',
      title: 'Invalid Sale',
      description: 'Bad pricing',
      price: 100,
      offerPrice: 100,
      offerLabel: 'NO DISCOUNT',
    };

    await expect(updateHeroBanner(input)).rejects.toThrow(AppError);
    await expect(updateHeroBanner(input)).rejects.toThrow('INVALID_OFFER_PRICE');
  });

  it('should get updated settings after update', async () => {
    const input = {
      imagePath: '/images/new-hero.jpg',
      title: 'Winter Sale',
      description: 'New season deals',
      price: 200,
      offerPrice: 150,
      offerLabel: '25% OFF',
    };

    await updateHeroBanner(input);
    const result = await getAppSettings();
    expect(result.homeHeroBanner).toMatchObject(input);
  });
});
```

---

## 9. Integration Tests (`test/integration/app-settings.test.ts`)

**Test cases for API routes:**

### Setup
- Use MongoDB Memory Server
- Clear database before tests
- Import route handlers directly

### Test: `should get default settings via GET /api/admin/settings`
- Create mock Request
- Call GET handler
- Expect 200 status
- Verify response contains default structure

### Test: `should update hero banner via PATCH /api/admin/settings/hero-banner`
- Create valid hero banner payload
- Create mock Request with JSON body
- Call PATCH handler
- Expect 200 status
- Verify response contains updated hero banner

### Test: `should return 400 for invalid offer price`
- Create payload with offerPrice >= price
- Call PATCH handler
- Expect 400 status
- Verify error message

### Test: `should return 400 for invalid schema (missing fields)`
- Create incomplete payload
- Call PATCH handler
- Expect 400 status
- Verify Zod validation error

### Test: `should persist settings across requests`
- Update hero banner via PATCH
- Get settings via GET
- Verify data matches

**Implementation outline:**
```typescript
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { GET } from '@/app/api/admin/settings/route';
import { PATCH } from '@/app/api/admin/settings/hero-banner/route';
import { clear } from '../test-db';

describe('App Settings API Integration', () => {
  beforeAll(async () => {
    await clear();
  });

  afterAll(async () => {
    await clear();
  });

  it('should get default settings via GET', async () => {
    const req = new Request('http://localhost/api/admin/settings');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBeDefined();
    expect(body.homeHeroBanner).toBeUndefined();
  });

  it('should update hero banner via PATCH', async () => {
    const payload = {
      imagePath: '/images/hero-banner.jpg',
      title: 'Mega Sale',
      description: 'Limited time offer',
      price: 500,
      offerPrice: 300,
      offerLabel: '40% OFF',
    };

    const req = new Request('http://localhost/api/admin/settings/hero-banner', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.homeHeroBanner).toMatchObject(payload);
  });

  it('should return 400 for invalid offer price', async () => {
    const payload = {
      imagePath: '/images/hero.jpg',
      title: 'Bad Sale',
      description: 'Invalid pricing',
      price: 100,
      offerPrice: 150,
      offerLabel: 'INVALID',
    };

    const req = new Request('http://localhost/api/admin/settings/hero-banner', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for missing required fields', async () => {
    const payload = {
      imagePath: '/images/hero.jpg',
      // Missing other required fields
    };

    const req = new Request('http://localhost/api/admin/settings/hero-banner', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('should persist settings across requests', async () => {
    const payload = {
      imagePath: '/images/persistent.jpg',
      title: 'Persistent Sale',
      description: 'This should persist',
      price: 1000,
      offerPrice: 800,
      offerLabel: '20% OFF',
    };

    // Update
    const patchReq = new Request('http://localhost/api/admin/settings/hero-banner', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await PATCH(patchReq);

    // Get
    const getReq = new Request('http://localhost/api/admin/settings');
    const res = await GET();
    const body = await res.json();

    expect(body.homeHeroBanner).toMatchObject(payload);
  });
});
```

---

## 10. Implementation Order

1. ✅ Create `lib/app-settings/app-settings.schema.ts` with Zod schemas
2. ✅ Create `lib/app-settings/model/app-settings.model.ts` with interfaces and transformers
3. ✅ Create `lib/app-settings/app-settings.service.ts` with business logic
4. ✅ Create `lib/app-settings/app-settings.controller.ts` with handlers
5. ✅ Create `lib/app-settings/index.ts` to export public API
6. ✅ Create `app/api/admin/settings/route.ts` for GET endpoint
7. ✅ Create `app/api/admin/settings/hero-banner/route.ts` for PATCH endpoint
8. ✅ Create `test/unit/app-settings.service.test.ts` with unit tests
9. ✅ Create `test/integration/app-settings.test.ts` with integration tests
10. ✅ Run tests: `npm run test:unit` and `npm run test:integration`
11. ✅ Test manually with sample requests

---

## 11. Key Design Decisions

- **Singleton pattern**: Only one settings document exists (no ID needed in routes)
- **Upsert strategy**: Service creates document if missing (no separate initialization needed)
- **Nested structure**: Hero banner is nested object, allowing easy expansion for other banners
- **Admin-only**: Routes under `/api/admin/` path (auth middleware can be added later)
- **Graceful defaults**: GET returns empty/default settings if none exist (no 404)
- **Price validation**: Business rule enforced in service layer (offerPrice < price)
- **Comprehensive testing**: Both unit tests (service logic) and integration tests (API routes)

---

## 12. Future Extensibility

The structure allows easy addition of:
- Category-specific banners
- Footer settings
- Site-wide theme settings
- Email templates
- Notification preferences
- SEO metadata
- Social media links

Just add new nested objects to the schema and corresponding update handlers.

---

## 13. Testing Strategy

### Unit Tests Focus
- Business logic validation (price rules)
- Data transformation (model mappers)
- Error handling (AppError throwing)
- Database operations (CRUD)

### Integration Tests Focus
- HTTP request/response flow
- Schema validation (Zod)
- Controller error mapping
- End-to-end data persistence

### Coverage Goals
- Service functions: 100%
- Controller functions: 100%
- API routes: All endpoints tested
- Error paths: All error codes tested

---

## 14. Manual Testing Checklist

After implementation, test manually:

1. **GET settings (empty state)**
   ```bash
   curl http://localhost:3000/api/admin/settings
   ```

2. **PATCH hero banner (valid)**
   ```bash
   curl -X PATCH http://localhost:3000/api/admin/settings/hero-banner \
     -H "Content-Type: application/json" \
     -d '{
       "imagePath": "/images/hero.jpg",
       "title": "Summer Sale",
       "description": "Get amazing deals",
       "price": 100,
       "offerPrice": 75,
       "offerLabel": "25% OFF"
     }'
   ```

3. **GET settings (after update)**
   ```bash
   curl http://localhost:3000/api/admin/settings
   ```

4. **PATCH with invalid price (should fail)**
   ```bash
   curl -X PATCH http://localhost:3000/api/admin/settings/hero-banner \
     -H "Content-Type: application/json" \
     -d '{
       "imagePath": "/images/hero.jpg",
       "title": "Bad Sale",
       "description": "Invalid",
       "price": 100,
       "offerPrice": 100,
       "offerLabel": "NO DISCOUNT"
     }'
   ```

---

## Ready to Implement!

This plan provides a complete roadmap for building the app settings backend with comprehensive testing. Follow the implementation order and verify each step with the corresponding tests.
