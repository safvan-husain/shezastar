import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear, getCollection } from '../test-db';
import {
    ensureStorefrontSession,
    getStorefrontSession,
    revokeStorefrontSession,
    bindSessionToUser,
} from '@/lib/storefront-session';
import type { StorefrontSessionDocument } from '@/lib/storefront-session/model/storefront-session.model';
import { STOREFRONT_COOKIE_NAME } from '@/lib/storefront-session/session-token';
import { ObjectId } from 'mongodb';

const cookieJar: Record<string, { name: string; value: string }> = {};

const cookieStore = {
    get: vi.fn((name: string) => cookieJar[name]),
    set: vi.fn((nameOrOptions: any, value?: string) => {
        if (typeof nameOrOptions === 'string') {
            cookieJar[nameOrOptions] = { name: nameOrOptions, value: value ?? '' };
            return;
        }
        cookieJar[nameOrOptions.name] = { name: nameOrOptions.name, value: nameOrOptions.value };
    }),
    delete: vi.fn((name: string) => {
        delete cookieJar[name];
    }),
};

vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => cookieStore),
}));

function resetCookies() {
    Object.keys(cookieJar).forEach(key => delete cookieJar[key]);
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    cookieStore.delete.mockClear();
}

describe('Storefront session service', () => {
    beforeEach(async () => {
        process.env.USER_SESSION_SECRET = 'unit-test-session-secret';
        await clear();
        resetCookies();
    });

    it('creates a session when no cookie exists', async () => {
        const session = await ensureStorefrontSession({
            metadata: { userAgent: 'vitest', ipAddress: '127.0.0.1' },
        });

        expect(session.sessionId).toBeDefined();
        expect(cookieJar[STOREFRONT_COOKIE_NAME]).toBeDefined();

        const collection = await getCollection<StorefrontSessionDocument>('userSessions');
        const stored = await collection.findOne({ sessionId: session.sessionId });
        expect(stored?.metadata?.ipHash).toBeDefined();
        expect(stored?.status).toBe('active');
    });

    it('reuses an existing session when cookie is valid', async () => {
        const first = await ensureStorefrontSession();
        const second = await ensureStorefrontSession();
        expect(second.sessionId).toBe(first.sessionId);
    });

    it('revokes the session and clears the cookie', async () => {
        const session = await ensureStorefrontSession();
        await revokeStorefrontSession();

        expect(cookieJar[STOREFRONT_COOKIE_NAME]?.value).toBe('');

        const collection = await getCollection<StorefrontSessionDocument>('userSessions');
        const stored = await collection.findOne({ sessionId: session.sessionId });
        expect(stored?.status).toBe('revoked');
    });

    it('returns null when fetching without a session cookie', async () => {
        await revokeStorefrontSession();
        const session = await getStorefrontSession();
        expect(session).toBeNull();
    });

    it('binds a session to a user and exposes userId', async () => {
        const session = await ensureStorefrontSession();
        const userId = new ObjectId().toHexString();

        await bindSessionToUser(session.sessionId, userId);

        const bound = await getStorefrontSession();
        expect(bound?.userId).toBe(userId);

        const collection = await getCollection<StorefrontSessionDocument>('userSessions');
        const stored = await collection.findOne({ sessionId: session.sessionId });
        expect(stored?.userId?.toHexString()).toBe(userId);
    });
});
