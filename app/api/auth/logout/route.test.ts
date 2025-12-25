import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/logout/route';
import { NextRequest } from 'next/server';
import * as storefrontSession from '@/lib/storefront-session';

vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSessionId: vi.fn(),
    unbindSession: vi.fn(),
    revokeStorefrontSession: vi.fn(),
}));

describe('POST /api/auth/logout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should revoke storefront session on logout', async () => {
        const sessionId = 'test-session-id';
        vi.mocked(storefrontSession.getStorefrontSessionId).mockResolvedValue(sessionId);

        const req = new NextRequest('http://localhost/api/auth/logout', {
            method: 'POST',
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(storefrontSession.getStorefrontSessionId).toHaveBeenCalled();
        expect(storefrontSession.revokeStorefrontSession).toHaveBeenCalledWith(sessionId);
    });

    it('should handle missing session id gracefully', async () => {
        vi.mocked(storefrontSession.getStorefrontSessionId).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/auth/logout', {
            method: 'POST',
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(storefrontSession.revokeStorefrontSession).toHaveBeenCalledWith(undefined);
    });
});
