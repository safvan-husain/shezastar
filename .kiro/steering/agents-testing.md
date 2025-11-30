---
inclusion: fileMatch
fileMatchPattern: '**/__tests__/**/*|**/*.test.ts|**/*.test.tsx|vitest.config.ts'
---

# Testing Strategy

This document defines testing patterns and best practices for Server Actions, services, and UI.

---

## 🧪 Testing Approach

### **Integration Tests**

Integration tests directly test Server Actions and services.

**Location:** `__tests__/integration/`

**Approach:**
- Import Server Actions directly from `lib/actions`.
- Create mock `FormData` objects.
- Call actions and assert on results.
- Use Prisma against a dedicated MongoDB test database; clean collections between tests.

**Example:**

```ts
import { registerAction } from '@/lib/actions/auth.actions'
import { prisma } from '@/lib/db/prisma'

beforeEach(async () => {
  await prisma.user.deleteMany({})
})

it('registers a new user', async () => {
  const formData = new FormData()
  formData.append('email', 'test@test.com')
  formData.append('password', 'password123')
  formData.append('fullName', 'Test User')

  const result = await registerAction(formData)

  expect(result.success).toBe(true)
  const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } })
  expect(user).toBeDefined()
})
```

---

### **Unit Tests**

Unit tests cover services, validation helpers, and utilities.

**Location:** `lib/**/*.test.ts`

**Guidelines:**
- Test business logic in services (Prisma + domain rules).
- Test validation in Zod schemas.
- Mock external dependencies (e.g., third-party APIs).
- Keep tests focused and isolated.

**Example:**

```ts
import { registerUser } from '@/lib/services/auth.service'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/errors/app-error'

describe('Auth Service', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({})
  })

  it('hashes password when creating user', async () => {
    const user = await registerUser({
      email: 'test@test.com',
      password: 'password123',
      fullName: 'Test User',
    })

    const stored = await prisma.user.findUnique({ where: { id: user.id } })
    expect(stored?.passwordHash).not.toBe('password123')
  })

  it('throws for duplicate email', async () => {
    await registerUser({
      email: 'test@test.com',
      password: 'password123',
      fullName: 'Test User',
    })

    await expect(
      registerUser({
        email: 'test@test.com',
        password: 'password456',
        fullName: 'Another User',
      })
    ).rejects.toThrow(AppError)
  })
})
```

---

## 📋 Test Commands

```bash
npm test                  # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## ✅ Testing Principles

* Pure functions where possible; minimal side effects.
* Clean the MongoDB test database before each test suite/case.
* Use real Prisma operations in tests (no stubs for DB).
* Test happy paths and error cases.
* No tests required by default—add when needed.
