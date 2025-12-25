import { beforeAll, afterAll, vi } from 'vitest';
import * as db from './test-db.test';

// Mock the real module
vi.mock('@/lib/db/mongo-client', async () => {
    return await import('./test-db.test');
});

// Stub Next.js server-only checks so Vitest can import server modules.
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

beforeAll(async () => {
    await db.connect();
}, 30000);

afterAll(async () => {
    await db.close();
});
