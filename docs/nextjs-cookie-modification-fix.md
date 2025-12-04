# Next.js 15+ Cookie Modification Error - Resolution

## The Issue

### Error Message
```
Error: Cookies can only be modified in a Server Action or Route Handler.
Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options
```

### Context
- **Next.js Version**: 16.0.3 (Turbopack)
- **Date**: December 4, 2025
- **Location**: Storefront session management system

### What Triggered It
The error occurred when trying to set session cookies during layout rendering:

1. `app/(store)/layout.tsx` called `ensureStorefrontSessionAction()`
2. This function called `createStorefrontSession()` or `touchStorefrontSession()`
3. These service functions internally called `setStorefrontSessionCookie()`
4. Cookie modification during layout render is forbidden in Next.js 15+

### Stack Trace
```
at setStorefrontSessionCookie (lib\storefront-session\session-token.ts:65:17)
at createStorefrontSession (lib\storefront-session\storefront-session.service.ts:125:5)
at getOrCreateStorefrontSession (app\actions\session.ts:48:21)
at StorefrontLayout (app\(store)\layout.tsx:13:19)
```

## The Root Cause

In Next.js 15+, the `cookies()` API can only be used to **modify** cookies in:
- Server Actions (functions marked with `'use server'`)
- Route Handlers (`app/api/**/route.ts`)

Even though `ensureStorefrontSessionAction` was marked with `'use server'`, when called directly from a layout component during rendering, it's treated as a regular async function call, not a Server Action invocation.

## The Solution

### 1. Separate Cookie-Setting from Session Management

Modified `lib/storefront-session/storefront-session.service.ts`:

```typescript
// Added optional setCookie parameter (defaults to false)
export async function createStorefrontSession(
    sessionId: string,
    metadata?: StorefrontSessionMetadataInput,
    setCookie: boolean = false  // NEW PARAMETER
): Promise<StorefrontSession> {
    // ... create session in database ...
    
    if (setCookie) {
        await setStorefrontSessionCookie(storefrontSession.sessionId);
    }
    return storefrontSession;
}

export async function touchStorefrontSession(
    sessionId: string,
    metadata?: StorefrontSessionMetadataInput,
    setCookie: boolean = false  // NEW PARAMETER
): Promise<StorefrontSession> {
    // ... update session in database ...
    
    if (setCookie) {
        await setStorefrontSessionCookie(storefrontSession.sessionId);
    }
    return storefrontSession;
}
```

### 2. Created Layout-Safe Function

In `app/actions/session.ts`:

```typescript
// Safe for layouts - does NOT set cookies
export async function getOrCreateStorefrontSession(): Promise<StorefrontSession> {
    const metadata = { /* ... */ };
    const token = await getCurrentStorefrontSessionToken();

    if (token) {
        try {
            // Pass false to NOT set cookie during layout render
            return await touchStorefrontSession(token.sessionId, metadata, false);
        } catch (err) {
            // Handle expired/missing sessions
            return await createStorefrontSession(token.sessionId, metadata, false);
        }
    }

    // Create session in DB only (no cookie)
    const sessionId = randomBytes(16).toString('hex');
    return await createStorefrontSession(sessionId, metadata, false);
}
```

### 3. Updated Layout to Use Safe Function

In `app/(store)/layout.tsx`:

```typescript
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // Changed from ensureStorefrontSessionAction() to getOrCreateStorefrontSession()
  const session = await getOrCreateStorefrontSession();
  
  return (
    <StorefrontSessionProvider initialSession={session}>
      {/* ... */}
    </StorefrontSessionProvider>
  );
}
```

### 4. Created Route Handler for Cookie Setting

Created `app/api/storefront/session/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ensureStorefrontSession } from '@/lib/storefront-session';

export async function GET() {
    try {
        // This WILL set cookies because it's in a Route Handler
        const session = await ensureStorefrontSession();
        return NextResponse.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error('Failed to ensure session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}
```

### 5. Client-Side Cookie Initialization

Updated `components/storefront/StorefrontSessionProvider.tsx`:

```typescript
export function StorefrontSessionProvider({ initialSession, children }: StorefrontSessionProviderProps) {
    const [session, setSession] = useState(initialSession);
    
    // Initialize session cookie on mount
    useEffect(() => {
        const initSession = async () => {
            try {
                // Call Route Handler to set cookie
                await fetch('/api/storefront/session', { method: 'GET' });
            } catch (error) {
                console.error('Failed to initialize session:', error);
            }
        };
        initSession();
    }, []);
    
    // ... rest of component
}
```

## How It Works Now

1. **Server-Side (Layout Render)**:
   - Layout calls `getOrCreateStorefrontSession()`
   - Session is created/updated in database
   - NO cookie is set (avoids the error)
   - Session data passed to client via `initialSession` prop

2. **Client-Side (Component Mount)**:
   - `StorefrontSessionProvider` mounts
   - `useEffect` calls `/api/storefront/session` GET endpoint
   - Route Handler calls `ensureStorefrontSession()` which sets the cookie
   - Cookie is now available for subsequent API calls

3. **Subsequent Requests**:
   - Client makes API calls (e.g., add to wishlist)
   - Cookie is sent with request
   - API routes can read session from cookie

## Key Takeaways

1. **Never modify cookies during layout/page rendering** - even in Server Actions called from layouts
2. **Use Route Handlers** for cookie modification that needs to happen on page load
3. **Separate concerns**: Database operations can happen anywhere, cookie operations only in Route Handlers/Server Actions
4. **Client-side initialization** is acceptable for setting cookies via Route Handler calls

## Files Modified

- `lib/storefront-session/storefront-session.service.ts` - Added `setCookie` parameter
- `app/actions/session.ts` - Created `getOrCreateStorefrontSession()` 
- `app/(store)/layout.tsx` - Switched to cookie-safe function
- `app/api/storefront/session/route.ts` - Created Route Handler for cookie setting
- `components/storefront/StorefrontSessionProvider.tsx` - Added client-side initialization

## Related Documentation

- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
