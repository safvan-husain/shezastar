import { NextResponse } from 'next/server';

import {
    handleGetBillingDetailsForCurrentSession,
    handleSetBillingDetailsForCurrentSession,
} from '@/lib/cart/cart.controller';

type RouteParams = { params: Promise<Record<string, string>> };

export async function GET(req: Request, ctx: RouteParams) {
    await ctx.params;
    const { status, body } = await handleGetBillingDetailsForCurrentSession();
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'GET',
        },
    });
}

export async function PUT(req: Request, ctx: RouteParams) {
    await ctx.params;
    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }
    const { status, body } = await handleSetBillingDetailsForCurrentSession(payload);
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'PUT',
        },
    });
}
