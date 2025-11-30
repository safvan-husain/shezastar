---
inclusion: always
---

# Core Architecture Rules

This document defines the **architecture rules and conventions** for this Next.js project.

**Goal:** Clean separation of concerns, feature-based organization, and reusable business logic with Server Actions (no API routes).

**Tech Stack:**
- Next.js 16+ with App Router
- Prisma ORM targeting MongoDB
- Zod for validation
- Server Actions for all mutations

---

## 📁 Folder Structure

```
app/
  (auth)/
    login/
      page.tsx
    register/
      page.tsx

components/
  ui/
  forms/

lib/
  actions/                  // Server Actions (mutations)
    auth.actions.ts
    product.actions.ts
  
  queries/                  // Data fetching (read operations)
    auth.queries.ts
    product.queries.ts
  
  validations/              // Zod schemas
    auth.schema.ts
    product.schema.ts
  
  services/                 // Business logic
    auth.service.ts
    product.service.ts
  
  db/
    prisma.ts               // Prisma client singleton for MongoDB
  
  errors/
    app-error.ts
  
  utils/
    (...)

prisma/
  schema.prisma             // Prisma schema (MongoDB models)
  migrations/               // Database migrations (if used)
```

---

## 🏛 Layer Responsibilities

### **1. Server Actions (`lib/actions/*.actions.ts`)**

Server Actions handle all data mutations (create, update, delete).

**Responsibilities:**
- Include the `'use server'` directive.
- Validate input using Zod schemas.
- Call service functions for business logic.
- Handle errors and return user-friendly messages.
- Trigger cache revalidation (`revalidatePath`, `revalidateTag`).
- Handle redirects after mutations when needed.

**Server Actions DO NOT:**
- Contain business logic (delegate to services).
- Access the database directly (use services).
- Return sensitive data.

### **2. Queries (`lib/queries/*.queries.ts`)**

Query functions handle all read operations.

**Responsibilities:**
- Fetch data from the database via Prisma.
- Can be cached using `'use cache'` and/or `cache()` from React.
- Return domain objects or view models.

**Queries DO NOT:**
- Mutate data.
- Validate user input (read-only).
- Handle form submissions.

### **3. Services (`lib/services/*.service.ts`)**

All business logic lives here.

**Responsibilities:**
- Domain rules and complex operations.
- Communicate with the database via Prisma.
- Throw `AppError` on rule failures.
- Return domain objects.

**Services DO NOT:**
- Validate raw form input (use Zod in actions).
- Know about HTTP or forms.
- Handle cache revalidation.

### **4. Validation Schemas (`lib/validations/*.schema.ts`)**

Zod schemas define input/output shapes.

**Responsibilities:**
- Define validation rules.
- Provide TypeScript inference.
- Reuse across actions and UI.

---

## 📡 Data Layer (Prisma with MongoDB)

This project uses **Prisma** as the ORM, configured for **MongoDB**.

### **Prisma Client Setup**

```ts
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Usage**

- Services import and use `prisma` directly.
- Queries use `prisma` for data fetching.
- All database operations go through Prisma (MongoDB provider).

---

## 🚧 Error Handling

Use a single `AppError` class. Services throw `AppError`; Server Actions translate to user-friendly responses and structured errors for the UI.

---

## 🔄 Flow Diagrams

### **Data Mutation Flow (Server Actions)**

```
[Form Submission / User Action]
      ↓
lib/actions/*.actions.ts
      ↓
validate input ←──── Zod schema
      ↓
lib/services/*.service.ts
      ↓
Prisma (MongoDB) operations
      ↓
revalidatePath / revalidateTag
      ↓
return result to client
      ↓
[UI Update / Redirect]
```

### **Data Fetching Flow (Queries)**

```
[Page/Component Render]
      ↓
lib/queries/*.queries.ts
      ↓
Prisma (MongoDB) query
      ↓
cache() / 'use cache'
      ↓
return data
      ↓
[Render UI]
```

---

## 📐 Naming Conventions

**File names:**

```
lib/actions/auth.actions.ts
lib/queries/auth.queries.ts
lib/services/auth.service.ts
lib/validations/auth.schema.ts
prisma/schema.prisma
```

**Functions:**
- Server Actions → `xxxAction`: `loginAction`, `registerAction`
- Queries → `getXxx`: `getUserById`, `getProducts`
- Services → verbs: `createUser`, `loginUser`, `validateCredentials`
- Schemas → PascalCase: `LoginSchema`, `RegisterSchema`

---

## 📥 Import & Dependency Rules

1. **`app/*` must never be imported inside `lib/*`.**
2. **Pages/Components** import from:
   - Server Actions (`lib/actions`)
   - Queries (`lib/queries`)
   - UI components
3. **Server Actions** import from:
   - Validation schemas (`lib/validations`)
   - Services (`lib/services`)
   - Next.js cache functions (`next/cache`)
4. **Queries** import from:
   - Prisma client (`lib/db/prisma`)
   - React cache (`react`)
5. **Services** import from:
   - Prisma client (`lib/db/prisma`)
   - Utils
   - Error classes
6. **No circular imports allowed.**

**Import Flow**

```
app/* → lib/actions → lib/services → prisma
app/* → lib/queries → prisma
```

---

## 🧩 Adding a New Feature (Checklist)

1. **Define Prisma Schema (MongoDB models):**
   - Add models to `prisma/schema.prisma`
   - Run `npx prisma db push` or migrations (if used)

2. **Create Validation Schemas:**
   - Add `lib/validations/<feature>.schema.ts`

3. **Create Service Layer:**
   - Add `lib/services/<feature>.service.ts`
   - Implement business logic with Prisma

4. **Create Server Actions** (for mutations):
   - Add `lib/actions/<feature>.actions.ts`
   - Mark with `'use server'`
   - Validate input, call services, revalidate cache

5. **Create Query Functions** (for reads):
   - Add `lib/queries/<feature>.queries.ts`
   - Use `cache()` for deduplication where appropriate

6. **Add UI Pages:**
   - Create pages in `app/`
   - Import and use Server Actions in forms
   - Call query functions for data fetching

7. **Add Shared Components:**
   - Put reusable UI in `/components`

---

## ✅ Core Rules

* **Use Server Actions for all mutations (no API routes).**
* **All validation must use Zod.**
* **Database access only through Prisma (MongoDB).**
* **Never import from `app/*` inside `lib/*`.**
* **No circular imports allowed.**
* **Follow this structure unless explicitly overridden.**
