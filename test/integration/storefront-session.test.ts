import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from '../test-db';
import { GET, POST, DELETE } from '@/app/api/storefront/session/route';

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

const ctx = { params: Promise.resolve({}) };

describe('Storefront session route handlers', () => {
    beforeEach(async () => {
        process.env.USER_SESSION_SECRET = 'integration-session-secret';
        await clear();
        resetCookies();
    });

    it('ensures a session via POST and fetches it via GET', async () => {
        const postResponse = await POST(
            new Request('http://localhost/api/storefront/session', { method: 'POST', body: '{}' }),
            ctx
        );
        const postBody = await postResponse.json();
        expect(postResponse.status).toBe(200);
        expect(postBody.sessionId).toBeDefined();

        const getResponse = await GET(new Request('http://localhost/api/storefront/session'), ctx);
        expect(getResponse.status).toBe(200);
        const getBody = await getResponse.json();
        expect(getBody.sessionId).toBe(postBody.sessionId);
    });

    it('revokes a storefront session', async () => {
        await POST(new Request('http://localhost/api/storefront/session', { method: 'POST', body: '{}' }), ctx);

        const deleteResponse = await DELETE(
            new Request('http://localhost/api/storefront/session', { method: 'DELETE' }),
            ctx
        );
        expect(deleteResponse.status).toBe(200);
        const deleteBody = await deleteResponse.json();
        expect(deleteBody.success).toBe(true);

        const getResponse = await GET(new Request('http://localhost/api/storefront/session'), ctx);
        expect(getResponse.status).toBe(404);
    });
});
