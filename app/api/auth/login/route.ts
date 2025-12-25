import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/auth/auth.schema';
import { loginUser } from '@/lib/auth/auth.service';
import { catchError } from '@/lib/errors/app-error';
import { ensureStorefrontSession, bindSessionToUser } from '@/lib/storefront-session';
import { mergeCarts } from '@/lib/cart/cart.service';
import { mergeWishlists } from '@/lib/wishlist/wishlist.service';
import { mergeRecentlyViewed } from '@/lib/product/recently-viewed.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = LoginSchema.parse(body);

        const user = await loginUser(email, password);

        const session = await ensureStorefrontSession();

        // 1. Merge carts and wishlists (Guest -> User)
        // If we bind first, the session might be treated as already authenticated in some race conditions,
        // but merge logic specifically looks for guest (by sessionId) and user (by userId) carts.
        // It's safe to run merge before binding.

        await mergeCarts(session.sessionId, user.id);
        await mergeWishlists(session.sessionId, user.id);
        await mergeRecentlyViewed(session.sessionId, user.id);

        // 2. Bind session
        await bindSessionToUser(session.sessionId, user.id);

        return NextResponse.json({ status: 'success', user });
    } catch (err) {
        const { status, body } = catchError(err);
        return NextResponse.json(body, { status });
    }
}
