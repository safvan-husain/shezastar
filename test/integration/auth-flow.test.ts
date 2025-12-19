import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clear } from '../test-db';
import { POST as RegisterPOST } from '@/app/api/auth/register/route';
import { POST as LoginPOST } from '@/app/api/auth/login/route';
import { POST as LogoutPOST } from '@/app/api/auth/logout/route';
import { GET as CartGET, POST as CartPOST } from '@/app/api/storefront/cart/route';
import { GET as SessionGET, POST as SessionPOST } from '@/app/api/storefront/session/route';
import { createProduct } from '@/lib/product/product.service';

const cookieJar: Record<string, { name: string; value: string }> = {};
const cookieStore = {
    get: vi.fn((name: string) => cookieJar[name]),
    set: vi.fn((nameOrOptions: any, value?: string) => {
        if (typeof nameOrOptions === 'string') {
            cookieJar[nameOrOptions] = { name: nameOrOptions, value: value ?? '' };
            return;
        }
        cookieJar[nameOrOptions.name] = { name: nameOrOptions.name, value: nameOrOptions.value };
    }),
    delete: vi.fn((name: string) => {
        delete cookieJar[name];
    }),
};
vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => cookieStore),
}));
function resetCookies() {
    Object.keys(cookieJar).forEach(key => delete cookieJar[key]);
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    cookieStore.delete.mockClear();
}

const ctx = { params: Promise.resolve({}) };

describe('Auth Flow & Cart Merging', () => {
    let productId: string;

    beforeEach(async () => {
        process.env.USER_SESSION_SECRET = 'auth-test-secret';
        await clear();
        resetCookies();
        const product = await createProduct({
            name: 'Test Product',
            subtitle: 'Product Subtitle',
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });
        productId = product.id;
    });

    it('merges guest cart into user cart on registration', async () => {
        // 1. Add item as guest
        await CartPOST(new Request('http://localhost/api/storefront/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, selectedVariantItemIds: [], quantity: 1 }),
            headers: { 'content-type': 'application/json' },
        }) as any, ctx);

        // Verify guest cart has item
        const guestRes = await CartGET(new Request('http://localhost/api/storefront/cart') as any, ctx);
        const guestCart = await guestRes.json();
        expect(guestCart.totalItems).toBe(1);

        // 2. Register
        const registerRes = await RegisterPOST(new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
            headers: { 'content-type': 'application/json' },
        }) as any);

        if (registerRes.status !== 201) {
            console.error('Register Error:', await registerRes.json());
        }
        expect(registerRes.status).toBe(201);
        const registerBody = await registerRes.json();
        const registeredUserId = registerBody?.user?.id;
        expect(registeredUserId).toBeDefined();

        // 3. Verify cart is now user's (still accessible via session)
        const userRes = await CartGET(new Request('http://localhost/api/storefront/cart') as any, ctx);
        const userCart = await userRes.json();
        console.log('User Cart:', JSON.stringify(userCart, null, 2));
        expect(userCart.totalItems).toBe(1);
        expect(userCart.userId).toBeDefined();

        const sessionRes = await SessionGET(new Request('http://localhost/api/storefront/session') as any, ctx);
        expect(sessionRes.status).toBe(200);
        const sessionBody = await sessionRes.json();
        expect(sessionBody.userId).toBe(registeredUserId);
    });

    it('merges guest cart into existing user cart on login', async () => {
        // 1. Register a user
        const initialRegisterRes = await RegisterPOST(new Request('http://localhost/api/auth/register', {
            method: 'POST', body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
            headers: { 'content-type': 'application/json' },
        }) as any);
        expect(initialRegisterRes.status).toBe(201);

        // Logout
        await LogoutPOST(new Request('http://localhost/api/auth/logout', { method: 'POST' }) as any);
        const guestSessionRes = await SessionPOST(
            new Request('http://localhost/api/storefront/session', { method: 'POST', body: '{}' }),
            ctx
        );
        expect(guestSessionRes.status).toBe(200);
        const guestSessionBody = await guestSessionRes.json();
        expect(guestSessionBody.userId).toBeUndefined();

        // Reset cookies manualy to simulate new device
        resetCookies();

        // 2. Add item to GUEST cart
        await CartPOST(new Request('http://localhost/api/storefront/cart', {
            method: 'POST', body: JSON.stringify({ productId, selectedVariantItemIds: [], quantity: 2 }),
            headers: { 'content-type': 'application/json' },
        }) as any, ctx);

        // 3. Login
        const loginRes = await LoginPOST(new Request('http://localhost/api/auth/login', {
            method: 'POST', body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
            headers: { 'content-type': 'application/json' },
        }) as any);

        if (loginRes.status !== 200) {
            console.error('Login Error:', await loginRes.json());
        }
        expect(loginRes.status).toBe(200);
        const loginBody = await loginRes.json();
        const loggedInUserId = loginBody?.user?.id;
        expect(loggedInUserId).toBeDefined();

        // 4. Verify merged cart 
        const userRes = await CartGET(new Request('http://localhost/api/storefront/cart') as any, ctx);
        const userCart = await userRes.json();
        expect(userCart.totalItems).toBe(2);

        const sessionRes = await SessionGET(new Request('http://localhost/api/storefront/session') as any, ctx);
        expect(sessionRes.status).toBe(200);
        const sessionBody = await sessionRes.json();
        expect(sessionBody.userId).toBe(loggedInUserId);
    });
});
