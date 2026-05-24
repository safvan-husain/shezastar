import { describe, expect, it, vi } from 'vitest';

import { POST as AdminLogoutPOST } from '@/app/api/admin/auth/logout/route';

const cookieSet = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => ({
        set: cookieSet,
    })),
}));

describe('admin auth logout', () => {
    it('expires the admin session cookie', async () => {
        cookieSet.mockClear();

        const response = await AdminLogoutPOST(
            new Request('http://localhost/api/admin/auth/logout', { method: 'POST' }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ status: 'success' });
        expect(cookieSet).toHaveBeenCalledWith({
            name: 'ss-admin-session',
            value: '',
            maxAge: 0,
            path: '/',
        });
    });
});
