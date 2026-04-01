import { NextResponse } from 'next/server';

import {
    handleAddToCart,
    handleClearCart,
    handleGetCartForCurrentSession,
    handleRemoveCartItem,
    handleUpdateCartItem,
} from '@/lib/cart/cart.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

type RouteParams = { params: Promise<Record<string, string>> };

async function GETHandler(req: Request, ctx: RouteParams) {
    await ctx.params;
    const { status, body } = await handleGetCartForCurrentSession();
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'GET',
        },
    });
}

async function POSTHandler(req: Request, ctx: RouteParams) {
    await ctx.params;
    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }
    const { status, body } = await handleAddToCart(payload);
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'POST',
        },
    });
}

async function PATCHHandler(req: Request, ctx: RouteParams) {
    await ctx.params;
    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }

    const { status, body } = await handleUpdateCartItem(payload);
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'PATCH',
        },
    });
}

async function DELETEHandler(req: Request, ctx: RouteParams) {
    await ctx.params;
    let payload: any = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }

    const hasItemTarget = typeof payload.productId === 'string';
    const { status, body } = hasItemTarget
        ? await handleRemoveCartItem(payload)
        : await handleClearCart(payload);

    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'DELETE',
        },
    });
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
export const PATCH = withRequestLogging(PATCHHandler);
export const DELETE = withRequestLogging(DELETEHandler);
