import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/auth/auth.schema';
import { loginUser, registerUser } from '@/lib/auth/auth.service';
import { catchError } from '@/lib/errors/app-error';
import { ensureStorefrontSession, bindSessionToUser } from '@/lib/storefront-session';
import { mergeCarts } from '@/lib/cart/cart.service';
import { mergeWishlists } from '@/lib/wishlist/wishlist.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = RegisterSchema.parse(body);

        // 1. Register
        const user = await registerUser(email, password);

        // 2. Login (auto-login after register)
        // Verify credentials just to be safe/consistent, or just use the user object
        // We'll just bind the session directly since we trusted the registration

        // 3. Bind Session & Merge Carts
        // Ensure we have a session first (guest session likely exists)
        const session = await ensureStorefrontSession();

        await bindSessionToUser(session.sessionId, user.id);

        // No need to merge carts usually on register since user is new (empty cart),
        // BUT if guest added items, those should become the user's cart.
        // The merge logic handles "User cart missing" by converting guest cart.
        await mergeCarts(session.sessionId, user.id);
        await mergeWishlists(session.sessionId, user.id);

        return NextResponse.json({ status: 'success', user }, { status: 201 });
    } catch (err) {
        const { status, body } = catchError(err);
        return NextResponse.json(body, { status });
    }
}
