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

export async function ensureStorefrontSessionAction(): Promise<StorefrontSession> {
    // Get metadata from headers
    const headerStore = await headers();
    const userAgent = headerStore.get('user-agent') ?? undefined;
    const ipAddressRaw = headerStore.get('x-forwarded-for') ?? undefined;
    const ipAddress = ipAddressRaw?.split(',')[0]?.trim() ?? undefined;
    
    const metadata = { userAgent, ipAddress };

    // Check if cookie exists
    const token = await getCurrentStorefrontSessionToken();

    if (token) {
        // Try to touch existing session
        try {
            const session = await touchStorefrontSession(token.sessionId, metadata);
            return session;
        } catch (err) {
            // If session not found or expired, create new one with same token
            if (
                err instanceof AppError &&
                ['SESSION_NOT_FOUND', 'SESSION_REVOKED', 'SESSION_EXPIRED'].includes(err.code)
            ) {
                return await createStorefrontSession(token.sessionId, metadata);
            }
            throw err;
        }
    }

    // No cookie exists - create new session ID, cookie, and DB record
    const sessionId = randomBytes(16).toString('hex');
    
    const tokenValue = createStorefrontSessionToken(sessionId);
    const cookieStore = await cookies();
    
    cookieStore.set({
        name: STOREFRONT_COOKIE_NAME,
        value: tokenValue,
        maxAge: SESSION_DURATION_SECONDS,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });

    const session = await createStorefrontSession(sessionId, metadata);
    
    return session;
}
