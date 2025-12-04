import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { getStorefrontSessionId } from '@/lib/storefront-session';
import {
    handleAddToWishlist,
    handleGetWishlist,
    handleRemoveFromWishlist,
} from '@/lib/wishlist/wishlist.controller';

type RouteParams = { params: Promise<Record<string, string>> };

async function requireSessionId() {
    const sessionId = await getStorefrontSessionId();
    if (!sessionId) {
        return null;
    }
    return sessionId;
}

export async function GET(req: Request, ctx: RouteParams) {
    await ctx.params;

    const sessionId = await requireSessionId();
    if (!sessionId) {
        return NextResponse.json(
            { code: 'SESSION_REQUIRED', error: 'SESSION_REQUIRED' },
            { status: 401, headers: { 'x-request-method': 'GET' } }
        );
    }

    const { status, body } = await handleGetWishlist(sessionId);
    return NextResponse.json(body, { status, headers: { 'x-request-method': 'GET' } });
}

export async function POST(req: Request, ctx: RouteParams) {
    await ctx.params;

    const sessionId = await requireSessionId();
    if (!sessionId) {
        return NextResponse.json(
            { code: 'SESSION_REQUIRED', error: 'SESSION_REQUIRED' },
            { status: 401, headers: { 'x-request-method': 'POST' } }
        );
    }

    let payload: any = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }

    const { status, body } = await handleAddToWishlist({
        ...payload,
        sessionId,
    });

    if (status >= 200 && status < 300) {
        revalidatePath('/(store)/wishlist', 'page');
    }

    return NextResponse.json(body, { status, headers: { 'x-request-method': 'POST' } });
}

export async function DELETE(req: Request, ctx: RouteParams) {
    await ctx.params;

    const sessionId = await requireSessionId();
    if (!sessionId) {
        return NextResponse.json(
            { code: 'SESSION_REQUIRED', error: 'SESSION_REQUIRED' },
            { status: 401, headers: { 'x-request-method': 'DELETE' } }
        );
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    const variantIdsParam = url.searchParams.get('variantIds');

    let payload: any = {};

    if (productId) {
        const selectedVariantItemIds =
            variantIdsParam?.split(',').map(id => id.trim()).filter(Boolean) ?? [];
        payload = {
            productId,
            selectedVariantItemIds,
        };
    } else {
        try {
            payload = await req.json();
        } catch {
            payload = {};
        }
    }

    const { status, body } = await handleRemoveFromWishlist({
        ...payload,
        sessionId,
    });

    if (status >= 200 && status < 300) {
        revalidatePath('/(store)/wishlist', 'page');
    }

    return NextResponse.json(body, { status, headers: { 'x-request-method': 'DELETE' } });
}
