# Error Handling & User Feedback

**Goal:** Provide detailed, actionable error feedback to users with expandable, copyable details; propagate backend messages from Server Actions to the UI.

---

## 🎯 Core Principles

1. Never show generic error messages—propagate specific, user-safe details.
2. Use toast notifications for all errors (server actions, form submissions).
3. Make errors expandable; show summary by default, full details on expand.
4. Provide copy functionality for the full error object.
5. Auto-dismiss only collapsed toasts; expanded toasts persist until closed.

---

## 🏗 Architecture

### **1. Error Class**

```ts
// lib/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    }
  }
}
```

### **2. Server Action Error Handling**

```ts
'use server'

import { AppError } from '@/lib/errors/app-error'

export async function someAction(formData: FormData) {
  try {
    // ...validate with Zod, call services
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.toJSON() }
    }

    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        status: 500,
        details: {
          originalError: error instanceof Error ? error.message : String(error),
          stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        },
        timestamp: new Date().toISOString(),
      },
    }
  }
}
```

### **3. Toast Component with Expandable Details**

```tsx
// components/ui/error-toast.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, ChevronDown, ChevronUp, X } from 'lucide-react'

interface ErrorDetails {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
  timestamp?: string
}

export function showErrorToast(error: ErrorDetails) {
  toast.custom((t) => <ErrorToastContent error={error} toastId={t} />, {
    duration: error ? Infinity : 5000,
    position: 'top-right',
  })
}

function ErrorToastContent({ error, toastId }: { error: ErrorDetails; toastId: string | number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const copyToClipboard = async () => {
    const errorText = JSON.stringify(error, null, 2)
    await navigator.clipboard.writeText(errorText)
    toast.success('Error details copied', { duration: 2000 })
  }

  return (
    <div className="bg-destructive text-destructive-foreground rounded-lg shadow-lg p-4 min-w-[320px] max-w-[520px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <p className="font-semibold text-sm">{error.message}</p>
          {error.code && <p className="text-xs opacity-90 mt-1">Code: {error.code}</p>}
        </div>
        <button
          onClick={() => toast.dismiss(toastId)}
          className="text-destructive-foreground/80 hover:text-destructive-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive-foreground/10 hover:bg-destructive-foreground/20 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              View Details
            </>
          )}
        </button>

        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive-foreground/10 hover:bg-destructive-foreground/20 transition-colors"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-top border-destructive-foreground/20">
          <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto max-h-[320px] overflow-y-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
```

### **4. Usage in Forms/Components**

```tsx
'use client'

import { useTransition } from 'react'
import { someAction } from '@/lib/actions/some.actions'
import { showErrorToast } from '@/components/ui/error-toast'
import { toast } from 'sonner'

export function SomeForm() {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await someAction(formData)

      if (!result.success && result.error) {
        showErrorToast(result.error)
        return
      }

      toast.success('Action completed successfully')
    })
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isPending}>
        Submit
      </button>
    </form>
  )
}
```

---

## 📋 Error Toast Behavior Rules

1. Auto-dismiss collapsed toasts after ~5s; expanded toasts never auto-dismiss.
2. Stack multiple errors—do not replace.
3. Copy includes full error object (timestamp, code, details, stack when dev).
4. Show user-friendly message in collapsed state; technical details in expanded.
5. Back-end messages must surface in the toast and be copyable for testing.

---

## 🔧 Configuration

```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" expand={false} richColors />
      </body>
    </html>
  )
}
```

---

## ✅ Checklist

- [ ] Server action returns structured error object (not just a string).
- [ ] Error includes: `message`, `code`, `status`, `details`, `timestamp`.
- [ ] Use `showErrorToast()` instead of generic `toast.error()`.
- [ ] Toast is expandable with “View Details” and “Copy”.
- [ ] Expanded toast doesn’t auto-dismiss.
- [ ] Development errors include stack traces; production hides sensitive info.

---

## 🚫 Anti-Patterns

❌ Generic error strings: `return { error: 'Something went wrong' }`  
❌ Silent failures: `return { success: false }` without details  
✅ Return structured error + show via `showErrorToast(result.error)`
