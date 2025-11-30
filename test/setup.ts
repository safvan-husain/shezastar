import { beforeAll, afterAll, afterEach, vi } from 'vitest';

vi.mock('@/lib/db/prisma', () => import('./prisma-mock'));

import { startTestDB, stopTestDB, clearDatabase } from './test-db';

vi.mock('next/cache', async () => {
    const actual = await vi.importActual<any>('next/cache');
    return {
        ...actual,
        revalidatePath: vi.fn(),
        revalidateTag: vi.fn(),
    };
});

beforeAll(async () => {
    await startTestDB();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await stopTestDB();
});
