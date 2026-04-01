import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { getStorefrontSessionId } from '@/lib/storefront-session';
import { handleClearWishlist } from '@/lib/wishlist/wishlist.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

type RouteParams = { params: Promise<Record<string, string>> };

async function requireSessionId() {
    const sessionId = await getStorefrontSessionId();
    if (!sessionId) {
        return null;
    }
    return sessionId;
}

async function PATCHHandler(req: Request, ctx: RouteParams) {
    await ctx.params;

    const sessionId = await requireSessionId();
    if (!sessionId) {
        return NextResponse.json(
            { code: 'SESSION_REQUIRED', error: 'SESSION_REQUIRED' },
            { status: 401, headers: { 'x-request-method': 'PATCH' } }
        );
    }

    const { status, body } = await handleClearWishlist({ sessionId });

    if (status >= 200 && status < 300) {
        revalidatePath('/(store)/wishlist', 'page');
    }

    return NextResponse.json(body, { status, headers: { 'x-request-method': 'PATCH' } });
}

export const PATCH = withRequestLogging(PATCHHandler);
