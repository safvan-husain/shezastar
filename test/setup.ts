import { beforeAll, afterAll, vi } from 'vitest';
import * as db from './test-db';

// Mock the real module
vi.mock('@/lib/db/mongo-client', async () => {
    return await import('./test-db');
});

beforeAll(async () => {
    await db.connect();
});

afterAll(async () => {
    await db.close();
});
