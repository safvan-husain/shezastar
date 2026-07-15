import { beforeEach, describe, expect, it, vi } from 'vitest';

const readFile = vi.fn();
const loggerError = vi.fn();

vi.mock('node:fs/promises', () => ({ readFile }));
vi.mock('@/lib/logging/logger', () => ({
    logger: {
        error: loggerError,
    },
}));
vi.mock('@/lib/logging/request-logger', () => ({
    withRequestLogging: <T>(handler: T) => handler,
}));

describe('GET /uploads/[filename]', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        loggerError.mockResolvedValue(undefined);
    });

    it('serves a runtime-uploaded image with its browser content type', async () => {
        readFile.mockResolvedValue(Buffer.from([1, 2, 3]));
        const { GET } = await import('./route');

        const response = await GET(
            new Request('http://localhost/uploads/blog-cover.webp'),
            { params: Promise.resolve({ filename: 'blog-cover.webp' }) },
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/webp');
        expect(response.headers.get('cache-control')).toContain('immutable');
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('rejects traversal and unsupported filenames before reading the filesystem', async () => {
        const { GET } = await import('./route');
        const response = await GET(
            new Request('http://localhost/uploads/unsafe.svg'),
            { params: Promise.resolve({ filename: '../unsafe.svg' }) },
        );

        expect(response.status).toBe(400);
        expect(readFile).not.toHaveBeenCalled();
    });

    it('returns and logs a visible 404 when Mongo references a missing volume file', async () => {
        readFile.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
        const { GET } = await import('./route');
        const response = await GET(
            new Request('http://localhost/uploads/missing.jpg'),
            { params: Promise.resolve({ filename: 'missing.jpg' }) },
        );

        expect(response.status).toBe(404);
        expect(loggerError).toHaveBeenCalledWith(
            'Uploaded image file not found',
            expect.objectContaining({ pathname: '/uploads/missing.jpg' }),
        );
    });
});
