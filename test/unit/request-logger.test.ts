import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
    logger: {
        log: vi.fn().mockResolvedValue(undefined),
        error: vi.fn().mockResolvedValue(undefined),
        debug: vi.fn().mockResolvedValue(undefined),
    },
}));

import { logger } from '@/lib/logging/logger';
import { withRequestLogging } from '@/lib/logging/request-logger';

describe('withRequestLogging', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('logs request start and completion for successful handlers', async () => {
        const handler = withRequestLogging(async (req: Request) => {
            return new Response(JSON.stringify({ ok: true }), {
                status: 201,
                headers: {
                    'content-type': 'application/json',
                },
            });
        });

        const response = await handler(
            new Request('http://localhost/api/test?foo=bar', {
                method: 'POST',
                headers: {
                    'x-request-id': 'request-123',
                },
            })
        );

        expect(response.status).toBe(201);
        expect(logger.debug).toHaveBeenCalledWith(
            'Incoming request',
            expect.objectContaining({
                requestId: 'request-123',
                method: 'POST',
                pathname: '/api/test',
                query: 'foo=bar',
            })
        );
        expect(logger.log).toHaveBeenCalledWith(
            'Request completed',
            expect.objectContaining({
                requestId: 'request-123',
                method: 'POST',
                pathname: '/api/test',
                status: 201,
                durationMs: expect.any(Number),
            })
        );
    });

    it('logs request failures and rethrows the error', async () => {
        const handler = withRequestLogging(async (_req: Request) => {
            throw new Error('request failed');
        });

        await expect(
            handler(
                new Request('http://localhost/api/failure', {
                    method: 'GET',
                    headers: {
                        'x-request-id': 'request-456',
                    },
                })
            )
        ).rejects.toThrow('request failed');

        expect(logger.error).toHaveBeenCalledWith(
            'Request failed',
            expect.objectContaining({
                requestId: 'request-456',
                method: 'GET',
                pathname: '/api/failure',
                errorMessage: 'request failed',
                durationMs: expect.any(Number),
            })
        );
    });
});
