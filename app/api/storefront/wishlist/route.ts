import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';


import {
    handleAddToWishlist,
    handleGetWishlist,
    handleRemoveFromWishlist,
} from '@/lib/wishlist/wishlist.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

type RouteParams = { params: Promise<Record<string, string>> };

async function GETHandler(req: Request, ctx: RouteParams) {
    await ctx.params;

    const { status, body } = await handleGetWishlist();
    return NextResponse.json(body, { status, headers: { 'x-request-method': 'GET' } });
}

async function POSTHandler(req: Request, ctx: RouteParams) {
    await ctx.params;

    let payload: any = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }

    const { status, body } = await handleAddToWishlist(payload);

    if (status >= 200 && status < 300) {
        revalidatePath('/(store)/wishlist', 'page');
    }

    return NextResponse.json(body, { status, headers: { 'x-request-method': 'POST' } });
}

async function DELETEHandler(req: Request, ctx: RouteParams) {
    await ctx.params;

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

    const { status, body } = await handleRemoveFromWishlist(payload);

    if (status >= 200 && status < 300) {
        revalidatePath('/(store)/wishlist', 'page');
    }

    return NextResponse.json(body, { status, headers: { 'x-request-method': 'DELETE' } });
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
