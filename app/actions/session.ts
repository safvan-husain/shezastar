'use server';

import { cookies, headers } from 'next/headers';
import { randomBytes } from 'node:crypto';
import {
    STOREFRONT_COOKIE_NAME,
    createStorefrontSessionToken,
    getCurrentStorefrontSessionToken,
} from '@/lib/storefront-session/session-token';
import {
    createStorefrontSession,
    touchStorefrontSession,
    getStorefrontSession,
} from '@/lib/storefront-session';
import type { StorefrontSession } from '@/lib/storefront-session';
import { AppError } from '@/lib/errors/app-error';

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Helper to get or create session WITHOUT setting cookies (safe for layouts)
export async function getOrCreateStorefrontSession(): Promise<StorefrontSession> {
    const headerStore = await headers();
    const userAgent = headerStore.get('user-agent') ?? undefined;
    const ipAddressRaw = headerStore.get('x-forwarded-for') ?? undefined;
    const ipAddress = ipAddressRaw?.split(',')[0]?.trim() ?? undefined;
    
    const metadata = { userAgent, ipAddress };

    const token = await getCurrentStorefrontSessionToken();

    if (token) {
        try {
            // Pass false to NOT set cookie during layout render
            const session = await touchStorefrontSession(token.sessionId, metadata, false);
            return session;
        } catch (err) {
            if (
                err instanceof AppError &&
                ['SESSION_NOT_FOUND', 'SESSION_REVOKED', 'SESSION_EXPIRED'].includes(err.code)
            ) {
                return await createStorefrontSession(token.sessionId, metadata, false);
            }
            throw err;
        }
    }

    // No cookie - create session in DB only (cookie must be set elsewhere)
    const sessionId = randomBytes(16).toString('hex');
    const session = await createStorefrontSession(sessionId, metadata, false);
    
    return session;
}

// Server Action that CAN set cookies (must be invoked as action, not called during render)
export async function ensureStorefrontSessionAction(): Promise<StorefrontSession> {
    const headerStore = await headers();
    const userAgent = headerStore.get('user-agent') ?? undefined;
    const ipAddressRaw = headerStore.get('x-forwarded-for') ?? undefined;
    const ipAddress = ipAddressRaw?.split(',')[0]?.trim() ?? undefined;
    
    const metadata = { userAgent, ipAddress };

    const token = await getCurrentStorefrontSessionToken();

    if (token) {
        try {
            // Pass true to set cookie in Server Action
            const session = await touchStorefrontSession(token.sessionId, metadata, true);
            return session;
        } catch (err) {
            if (
                err instanceof AppError &&
                ['SESSION_NOT_FOUND', 'SESSION_REVOKED', 'SESSION_EXPIRED'].includes(err.code)
            ) {
                return await createStorefrontSession(token.sessionId, metadata, true);
            }
            throw err;
        }
    }

    // No cookie - create new session and set cookie
    const sessionId = randomBytes(16).toString('hex');
    const session = await createStorefrontSession(sessionId, metadata, true);
    
    return session;
}
