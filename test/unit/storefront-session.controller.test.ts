import { describe, expect, it, vi } from 'vitest';

import {
    handleEnsureStorefrontSession,
    handleGetStorefrontSession,
    handleRevokeStorefrontSession,
} from '@/lib/storefront-session/storefront-session.controller';

const ensureSessionMock = vi.fn();
const getSessionMock = vi.fn();
const revokeSessionMock = vi.fn();

vi.mock('@/lib/storefront-session/storefront-session.service', () => ({
    ensureStorefrontSession: ensureSessionMock,
    getStorefrontSession: getSessionMock,
    revokeStorefrontSession: revokeSessionMock,
}));

describe('Storefront session controller', () => {
    it('ensures a session and validates the payload', async () => {
        ensureSessionMock.mockResolvedValueOnce({
            sessionId: 'abc',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            lastActiveAt: new Date().toISOString(),
        });

        const response = await handleEnsureStorefrontSession({
            metadata: { userAgent: 'controller-test' },
        });

        expect(response.status).toBe(200);
        expect(ensureSessionMock).toHaveBeenCalledWith({ metadata: { userAgent: 'controller-test' } });
    });

    it('returns validation error when payload is invalid', async () => {
        const response = await handleEnsureStorefrontSession({
            metadata: { userAgent: 123 },
        });
        expect(response.status).toBe(400);
    });

    it('returns 404 when no storefront session exists', async () => {
        getSessionMock.mockResolvedValueOnce(null);
        const response = await handleGetStorefrontSession();
        expect(response.status).toBe(404);
    });

    it('returns 200 when revoking a session', async () => {
        revokeSessionMock.mockResolvedValueOnce({ success: true });
        const response = await handleRevokeStorefrontSession();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
    });
});
