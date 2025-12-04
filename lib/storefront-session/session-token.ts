import 'server-only';

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const STOREFRONT_COOKIE_NAME = 'ss-storefront-session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface StorefrontSessionTokenPayload {
    sessionId: string;
    expires: number;
}

export function createStorefrontSessionToken(sessionId: string) {
    const expires = Date.now() + SESSION_DURATION_SECONDS * 1000;
    const payload = `${sessionId}:${expires}`;
    const signature = signPayload(payload);
    return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function parseStorefrontSessionToken(token?: string): StorefrontSessionTokenPayload | null {
    if (!token) {
        return null;
    }

    let decoded: string;
    try {
        decoded = Buffer.from(token, 'base64').toString('utf8');
    } catch {
        return null;
    }

    const [sessionId, expiresRaw, signature] = decoded.split(':');
    if (!sessionId || !expiresRaw || !signature) {
        return null;
    }

    const expires = Number(expiresRaw);
    if (Number.isNaN(expires) || expires <= Date.now()) {
        return null;
    }

    const payload = `${sessionId}:${expires}`;
    const expectedSignature = signPayload(payload);

    try {
        const provided = Buffer.from(signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        if (provided.length !== expected.length) {
            return null;
        }
        if (!timingSafeEqual(provided, expected)) {
            return null;
        }
    } catch {
        return null;
    }

    return { sessionId, expires };
}

export async function setStorefrontSessionCookie(sessionId: string) {
    const sessionValue = createStorefrontSessionToken(sessionId);
    const cookieStore = await cookies();
    cookieStore.set({
        name: STOREFRONT_COOKIE_NAME,
        value: sessionValue,
        maxAge: SESSION_DURATION_SECONDS,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });
}

export async function revokeStorefrontSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.set({
        name: STOREFRONT_COOKIE_NAME,
        value: '',
        maxAge: 0,
        path: '/',
    });
}

export async function getCurrentStorefrontSessionToken(): Promise<StorefrontSessionTokenPayload | null> {
    const cookieStore = await cookies();
    const rawValue = cookieStore.get(STOREFRONT_COOKIE_NAME)?.value;
    return parseStorefrontSessionToken(rawValue);
}

function getSessionSecret() {
    const secret = process.env.USER_SESSION_SECRET;
    if (!secret) {
        throw new Error('USER_SESSION_SECRET must be set to sign storefront sessions');
    }
    return secret;
}

function signPayload(payload: string) {
    return createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
}
