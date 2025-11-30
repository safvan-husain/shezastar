import { beforeAll, afterAll, afterEach, vi } from 'vitest';

vi.mock('@/lib/db/prisma', () => import('./prisma-mock'));
vi.mock('next/cache', async () => {
    const actual = await vi.importActual<any>('next/cache');
    return {
        ...actual,
        revalidatePath: vi.fn(),
        revalidateTag: vi.fn(),
    };
});
vi.mock('@/lib/utils/file-upload', () => ({
    saveImages: vi.fn().mockResolvedValue([]),
    deleteImages: vi.fn().mockResolvedValue(undefined),
}));

import { startTestDB, stopTestDB, clearDatabase } from './test-db';

beforeAll(async () => {
    await startTestDB();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await stopTestDB();
});
