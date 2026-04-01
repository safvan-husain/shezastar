import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/logout/route';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';
import * as storefrontSession from '@/lib/storefront-session';

vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSessionId: vi.fn(),
    unbindSession: vi.fn(),
    revokeStorefrontSession: vi.fn(),
}));

vi.mock('@/lib/logging/logger', () => ({
    logger: {
        log: vi.fn().mockResolvedValue(undefined),
        error: vi.fn().mockResolvedValue(undefined),
        debug: vi.fn().mockResolvedValue(undefined),
    },
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
            headers: {
                'x-request-id': 'logout-request-1',
            },
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(storefrontSession.getStorefrontSessionId).toHaveBeenCalled();
        expect(storefrontSession.revokeStorefrontSession).toHaveBeenCalledWith(sessionId);
        expect(logger.debug).toHaveBeenCalledWith(
            'Incoming request',
            expect.objectContaining({
                requestId: 'logout-request-1',
                method: 'POST',
                pathname: '/api/auth/logout',
            })
        );
        expect(logger.log).toHaveBeenCalledWith(
            'Request completed',
            expect.objectContaining({
                requestId: 'logout-request-1',
                method: 'POST',
                pathname: '/api/auth/logout',
                status: 200,
            })
        );
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
