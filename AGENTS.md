## 🧠 Overview

This document defines the **architecture rules and conventions** the coding agent must follow while generating, updating, or refactoring code inside this project.
Goal: **clean separation of concerns**, **feature-based organization**, and **reusable business logic** shared across both web UI and external clients.

This project uses:

* **Next.js App Router**
* **Feature-based backend logic inside `/lib`**
* **Zod** for input/output schemas
* **MongoDB** as the primary database (no Prisma)
* **HTTP endpoints under `app/api/.../route.ts`**

---

## 📁 Folder Structure

```
app/
  api/
    auth/
      route.ts
    product/
      route.ts

components/

lib/
  auth/
    auth.service.ts
    auth.schema.ts
    auth.controller.ts
    model/
      user.model.ts
    index.ts
  product/
    product.service.ts
    product.schema.ts
    product.controller.ts
    model/
      product.model.ts
    index.ts

lib/db/
  mongo-client.ts          // MongoDB connection + helpers
  (Other DB adapters)

lib/errors/
  app-error.ts

lib/middleware/
  (...)

lib/utils/
  (...)
```

---

## 🏛 Layer Responsibilities

### **1. Route Handlers (`app/api/**/route.ts`)**

* Only place where `Request` and `NextResponse` are used.
* Must stay extremely small.

Responsibilities:

* Parse request (`req.json()`)
* Call the correct controller function
* Convert controller output → `NextResponse`

**No business logic.**

---

### **2. Controllers (`*.controller.ts`)**

Controllers coordinate application logic.

Responsibilities:

* Validate input using Zod
* Call service functions
* Return a normalized response:

```ts
{ status: number, body: any }
```

* Convert `AppError` → HTTP-safe output

**Controllers DO NOT:**

* Access MongoDB directly
* Contain business logic
* Import from `app/`

---

### **3. Services (`*.service.ts`)**

All business logic lives here.

Responsibilities:

* Domain rules
* Communicate with MongoDB (via `lib/db`)
* Throw `AppError` on rule failures
* Return domain objects (not HTTP)

**Services DO NOT:**

* Validate raw input
* Know HTTP
* Use Zod

---

### **4. Schemas (`*.schema.ts`)**

Zod schemas define request/response shapes.

Example:

```ts
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof LoginSchema>;
```

---

### **5. Models (`model/*.model.ts`)**

Models represent domain entities and transformers.

Responsibilities:

* Domain types
* DB result → Domain JSON mapper functions
* Serialization helpers

**No DB logic inside models.**

---

## 📡 Data Layer (MongoDB)

No Prisma.
Your data layer uses **MongoDB** through a custom adapter.

Place all DB logic in:

```
lib/db/
```

Examples:

* `mongo-client.ts`
* `<feature>-db.ts`

Services may import DB utilities directly.

---

## 🚧 Error Handling

Use a single `AppError` class.

```ts
// lib/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(code);
  }
}
```

Services throw `AppError`.
Controllers translate them to HTTP responses.

---

## 🔄 Flow Diagram

```
[HTTP Request]
      ↓
app/api/**/route.ts
      ↓
controller.handleAction(input)
      ↓        ↑
validate ←──── schema (Zod)
      ↓
service.function(validData)
      ↓
(model transforms)
      ↓
controller result
      ↓
NextResponse.json(...)
      ↓
[HTTP Response]
```

---

## 📐 Naming Conventions

File names:

```
auth.service.ts
auth.schema.ts
auth.controller.ts
model/user.model.ts
```

Functions:

* Services → verbs: `createUser`, `loginUser`
* Controllers → `handleXxx`: `handleLogin`
* Schemas → PascalCase: `LoginSchema`

---

## 📥 Import & Dependency Rules

1. **`app/*` must never be imported inside `lib/*`.**

2. Route handlers import only from:

   * controllers
   * utils

3. Controllers may import:

   * schemas
   * services
   * models

4. Services may import:

   * MongoDB adapters
   * models
   * utils

5. **No circular imports allowed.**

---

## 🧪 Testing Strategy

### **Integration Tests**

Integration tests directly test route handlers without requiring a running server.

Location: `__tests__/e2e/` (kept for historical reasons, but these are integration tests)

**Approach:**

* Import route handlers directly from `app/api/**/route.ts`
* Create mock `Request` objects
* Call handlers and assert on `Response` objects
* Use MongoDB Memory Server for database isolation

**Example:**

```ts
import { POST as registerPOST } from '@/app/api/auth/register/route';

function createMockRequest(body: any): Request {
  return new Request('http://localhost:3000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

it('should register a new user', async () => {
  const req = createMockRequest({
    email: 'test@test.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  });

  const response = await registerPOST(req);
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body.token).toBeDefined();
});
```

### **Unit Tests**

Unit tests for services, controllers, and utilities.

Location: `lib/**/*.test.ts`

**Guidelines:**

* Test business logic in services
* Test validation in controllers
* Mock external dependencies
* Keep tests focused and isolated

### **Test Commands**

```bash
npm test                  # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

### **General Principles**

* Pure functions where possible
* Minimal side effects
* Separated concerns
* No tests required by default (add when needed)

---

## 📜 Code Snippets

### Controller

```ts
// lib/auth/auth.controller.ts
import { LoginSchema } from './auth.schema';
import { loginUser } from './auth.service';
import { AppError } from '@/lib/errors/app-error';

export async function handleLogin(input: unknown) {
  try {
    const parsed = LoginSchema.parse(input);
    const result = await loginUser(parsed.data);
    return { status: 200, body: result };
  } catch (err) {
    catchError(err)
  }
}
```

---

### Route Handler

```ts
// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { handleLogin } from '@/lib/auth/auth.controller';

export async function POST(req: Request) {
  const data = await req.json();
  const { status, body } = await handleLogin(data);
  return NextResponse.json(body, { status });
}
```

---

### Service (MongoDB example)

```ts
// lib/auth/auth.service.ts
import { AppError } from '@/lib/errors/app-error';
import { users } from '@/lib/db/users-db';

export async function loginUser({ email, password }) {
  const user = await users.findByEmail(email);
  if (!user) throw new AppError(404, "USER_NOT_FOUND");

  const isValid = await users.verifyPassword(password, user.passwordHash);
  if (!isValid) throw new AppError(401, "INVALID_CREDENTIALS");

  return { token: users.issueToken(user) };
}
```

---

## 🧬 Component Structure

```
components/
  Button.tsx
  Card.tsx

app/
  dashboard/
    page.tsx
    components/
      DashboardCard.tsx
  product/
    page.tsx
    components/
      ProductCard.tsx
```

---

## 🧩 Adding a New Feature (Checklist)

1. Create folder: `lib/<feature>/`

2. Add:

   * `<feature>.schema.ts`
   * `<feature>.service.ts`
   * `<feature>.controller.ts`
   * `model/<entity>.model.ts`
   * `index.ts`

3. Add route:

```
app/api/<feature>/route.ts
```

4. Route → Controller → Service → MongoDB layer
5. Add UI pages if needed
6. Put shared components under `/components`

---

## 🎨 Frontend Architecture

### **Next.js 16 with Cache Components**

This project uses Next.js 16 with Cache Components enabled for optimal performance.

**Key Principles:**

* **Dynamic by default**: All pages are dynamic unless explicitly cached
* **Use `use cache` directive**: Cache components/functions that don't need runtime data
* **Suspense boundaries**: Wrap dynamic content in `<Suspense>` for streaming
* **Server Components first**: Use Server Components by default, Client Components only when needed

### **Runtime APIs and Suspense**

When using runtime APIs like `searchParams` or `params`, pass them as promises to child components wrapped in Suspense:

```tsx
// ✅ Correct - Pass promise to child wrapped in Suspense
export default function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{page?: string}> 
}) {
  return (
    <Suspense fallback={<Loading />}>
      <Content pagePromise={searchParams.then(p => p.page)} />
    </Suspense>
  )
}

async function Content({ pagePromise }: { pagePromise: Promise<string | undefined> }) {
  const page = await pagePromise
  // Use page...
}
```

### **Caching Strategy**

```ts
// Cache static data with cacheLife
import { cacheLife } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheLife('hours')
  const res = await fetch('/api/products')
  return res.json()
}
```

### **Revalidation with Tags**

```ts
// Tag cached data
import { cacheTag, revalidateTag } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheTag('products')
  // fetch data
}

// Revalidate after mutations
async function createProduct(data: FormData) {
  'use server'
  // create product
  revalidateTag('products')
}
```

### **Client Components**

Use `"use client"` only when needed:

* User interactions (onClick, onChange, etc.)
* Browser APIs (localStorage, window, etc.)
* React hooks (useState, useEffect, etc.)
* Third-party libraries requiring client-side

### **Folder Structure**

```
app/
  (auth)/              # Auth pages group
    login/
      page.tsx
    register/
      page.tsx
  (admin)/             # Admin pages group
    dashboard/
      page.tsx
    products/
      page.tsx
  products/            # Public product pages
    page.tsx
    [id]/
      page.tsx
  components/          # Page-specific components
    ProductCard.tsx

components/            # Shared components
  ui/
    Button.tsx
    Input.tsx
  forms/
    LoginForm.tsx

lib/
  actions/             # Server Actions
    auth.actions.ts
    product.actions.ts
```

### **Server Actions**

Place all mutations in Server Actions:

```ts
// lib/actions/product.actions.ts
'use server'

import { revalidateTag } from 'next/cache'

export async function createProduct(formData: FormData) {
  const res = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(formData)),
  })
  
  if (res.ok) {
    revalidateTag('products')
  }
  
  return res.json()
}
```

### **Form Handling**

Use Server Actions with forms:

```tsx
import { createProduct } from '@/lib/actions/product.actions'

export function ProductForm() {
  return (
    <form action={createProduct}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

---

## ✅ Final Notes

* **No business logic in route handlers.**
* **All validation must use Zod.**
* **MongoDB access only through `lib/db/`.**
* **Never import from `app/*` inside `lib/*`.**
* **Use Cache Components for optimal performance.**
* **Server Components by default, Client Components when needed.**
* **Follow this structure unless explicitly overridden.**

---