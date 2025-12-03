---
description: Implement 6 Optional Custom Cards Feature in App Settings
status: pending
priority: high
created: 2025-12-02
---

# Task: Implement 6 Optional Custom Cards Feature

## Overview
Add support for 6 optional, customizable cards in the app settings. Each card has a fixed position (card1-card6) but can be null/undefined if not set. Admin can create, update, or delete any card independently.

## Card Schema
Each card (when present) will have:
- `title`: string (required)
- `subtitle`: string (required)
- `imagePath`: string (required)
- `offerLabel`: string (required)
- `urlLink`: string (required, must be valid URL)

## Data Model Structure
```typescript
customCards: {
  card1: CustomCard | null,
  card2: CustomCard | null,
  card3: CustomCard | null,
  card4: CustomCard | null,
  card5: CustomCard | null,
  card6: CustomCard | null,
}
```

---

## Tasks

### Phase 1: Schema & Model Updates

- [ ] **Update Schema** (`lib/app-settings/app-settings.schema.ts`)
  - Create `CustomCardSchema` with 5 required fields (title, subtitle, imagePath, offerLabel, urlLink)
  - Create `CustomCardsSchema` as object with 6 nullable properties
  - Export types: `CustomCard`, `CustomCards`
  - Export schemas: `CreateCustomCardSchema`, `UpdateCustomCardSchema`

- [ ] **Update Model** (`lib/app-settings/model/app-settings.model.ts`)
  - Add `customCards: CustomCards` to `AppSettingsDocument`
  - Add `customCards: CustomCards` to `AppSettings`
  - Update `toAppSettings()` to handle null cards
  - Update `getDefaultSettings()` to return all cards as null

### Phase 2: Service Layer

- [ ] **Add Service Methods** (`lib/app-settings/app-settings.service.ts`)
  - `createCustomCard(cardKey: string, data: CustomCard): Promise<AppSettings>`
  - `updateCustomCard(cardKey: string, data: CustomCard): Promise<AppSettings>`
  - `deleteCustomCard(cardKey: string): Promise<AppSettings>`
  - `getCustomCard(cardKey: string): Promise<CustomCard | null>`
  - `getCustomCards(): Promise<CustomCards>`
  - Validate cardKey is one of: card1, card2, card3, card4, card5, card6

- [ ] **Service Unit Tests** (`test/unit/app-settings.service.test.ts`)
  - Test creating a card in empty slot
  - Test creating a card in occupied slot (should fail or update)
  - Test updating existing card
  - Test updating non-existent card (should fail)
  - Test deleting existing card (sets to null)
  - Test deleting non-existent card (should be idempotent)
  - Test invalid cardKey (card7, card0, etc.)
  - Test URL validation for urlLink
  - Test required field validation
  - Test getting specific card (exists and null)
  - Test getting all cards

### Phase 3: Controller Layer

- [ ] **Add Controller Methods** (`lib/app-settings/app-settings.controller.ts`)
  - `createCustomCard(cardKey: string, data: CustomCard)`
  - `updateCustomCard(cardKey: string, data: CustomCard)`
  - `deleteCustomCard(cardKey: string)`
  - `getCustomCard(cardKey: string)`
  - `getCustomCards()`

- [ ] **Controller Unit Tests** (`test/unit/app-settings.controller.test.ts`)
  - Test each method calls service correctly
  - Test error handling for each method
  - Test validation of cardKey format

### Phase 4: API Routes

- [ ] **Create Single Card Route** (`app/api/admin/settings/custom-cards/[cardKey]/route.ts`)
  - `POST /api/admin/settings/custom-cards/[cardKey]` - Create card
  - `PUT /api/admin/settings/custom-cards/[cardKey]` - Update card
  - `DELETE /api/admin/settings/custom-cards/[cardKey]` - Delete card (set to null)
  - `GET /api/admin/settings/custom-cards/[cardKey]` - Get specific card
  - Validate cardKey parameter
  - Add revalidatePath for mutations
  - Return appropriate status codes (200, 201, 400, 404, 500)

- [ ] **Create Cards Collection Route** (`app/api/admin/settings/custom-cards/route.ts`)
  - `GET /api/admin/settings/custom-cards` - Get all 6 cards (including nulls)

### Phase 5: Integration Tests

- [ ] **Create Integration Test Suite** (`test/integration/app-settings-custom-cards.test.ts`)
  
  **Create Tests:**
  - POST card1 with valid data → 201, card created
  - POST card1 when already exists → 400 or 409
  - POST with invalid cardKey (card7) → 400
  - POST with missing required field → 400
  - POST with invalid URL → 400
  
  **Update Tests:**
  - PUT existing card → 200, card updated
  - PUT non-existent card → 404
  - PUT with invalid data → 400
  
  **Delete Tests:**
  - DELETE existing card → 200, card set to null
  - DELETE non-existent card → 200 (idempotent)
  - DELETE invalid cardKey → 400
  
  **Read Tests:**
  - GET specific card (exists) → 200, returns card
  - GET specific card (null) → 200, returns null
  - GET all cards → 200, returns object with all 6 keys
  
  **Workflow Tests:**
  - Create card1 → Delete card1 → GET card1 returns null
  - Create all 6 cards → GET all returns all 6
  - Update card3 → Other cards unchanged
  - Delete card2 → card1 and card3 remain

### Phase 6: Database Migration (If Needed)

- [ ] **Create Migration Script** (`scripts/migrate-custom-cards.ts`)
  - Add `customCards` field to existing settings documents
  - Initialize all cards to null
  - Log migration results

---

## API Endpoints Summary

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/admin/settings/custom-cards` | Get all 6 cards | 200 |
| GET | `/api/admin/settings/custom-cards/[cardKey]` | Get specific card | 200, 404 |
| POST | `/api/admin/settings/custom-cards/[cardKey]` | Create new card | 201, 400, 409 |
| PUT | `/api/admin/settings/custom-cards/[cardKey]` | Update existing card | 200, 400, 404 |
| DELETE | `/api/admin/settings/custom-cards/[cardKey]` | Delete card (set to null) | 200, 400 |

---

## Implementation Notes

### Card Key Validation
```typescript
const VALID_CARD_KEYS = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'] as const;
type CardKey = typeof VALID_CARD_KEYS[number];

function isValidCardKey(key: string): key is CardKey {
  return VALID_CARD_KEYS.includes(key as CardKey);
}
```

### Default Settings
```typescript
{
  customCards: {
    card1: null,
    card2: null,
    card3: null,
    card4: null,
    card5: null,
    card6: null,
  }
}
```

### Schema Definition
```typescript
export const CustomCardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  imagePath: z.string().min(1, 'Image path is required'),
  offerLabel: z.string().min(1, 'Offer label is required'),
  urlLink: z.string().url('Must be a valid URL'),
});

export const CustomCardsSchema = z.object({
  card1: CustomCardSchema.nullable(),
  card2: CustomCardSchema.nullable(),
  card3: CustomCardSchema.nullable(),
  card4: CustomCardSchema.nullable(),
  card5: CustomCardSchema.nullable(),
  card6: CustomCardSchema.nullable(),
});
```

---

## Testing Strategy

- **Unit Tests**: Verify service and controller logic in isolation
- **Integration Tests**: Test complete API request/response flow
- **Validation Tests**: Ensure schema validation catches invalid data
- **Null Handling**: Test behavior with null/undefined cards
- **Edge Cases**: Invalid cardKeys, duplicate creates, idempotent deletes

---

## Success Criteria

✅ All 6 card positions can be independently created, updated, or deleted
✅ Null cards are handled correctly throughout the system
✅ Schema validation prevents invalid data
✅ API returns appropriate HTTP status codes
✅ All unit tests pass with good coverage
✅ All integration tests pass
✅ Default settings initialize all cards to null
✅ Deleting a card sets it to null (doesn't remove the key)

---

## Dependencies

- Zod for schema validation
- MongoDB for data persistence
- Jest for testing
- Next.js API routes

---

## Estimated Effort

- Schema & Model: 30 minutes
- Service Layer: 1 hour
- Controller Layer: 30 minutes
- API Routes: 1 hour
- Unit Tests: 1.5 hours
- Integration Tests: 2 hours
- **Total: ~6.5 hours**
