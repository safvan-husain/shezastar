import { NextResponse } from 'next/server';

import {
    handleAddToCart,
    handleClearCart,
    handleGetCartForCurrentSession,
    handleRemoveCartItem,
    handleUpdateCartItem,
} from '@/lib/cart/cart.controller';

type RouteParams = { params: Promise<Record<string, string>> };

export async function GET(req: Request, ctx: RouteParams) {
    await ctx.params;
    const { status, body } = await handleGetCartForCurrentSession();
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'GET',
        },
    });
}

export async function POST(req: Request, ctx: RouteParams) {
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

export async function PATCH(req: Request, ctx: RouteParams) {
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

export async function DELETE(req: Request, ctx: RouteParams) {
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

